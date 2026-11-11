import { randomUUID } from 'node:crypto';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { AGENT_TOOLS, MUTATING_TOOLS, executeMutation, executeReadTool, normalizeMutation, validateToolCall } from './lib/agentTools.js';

const rateBuckets = new Map();
const MAX_REQUESTS_PER_MINUTE = 12;
const MODEL_TIMEOUT_MS = 20_000;

function json(res, status, payload) { return res.status(status).json(payload); }
function fail(result) { if (result.error) throw new Error(result.error.message); return result.data; }
function withTimeout(promise, ms = MODEL_TIMEOUT_MS) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Tempo limite do Gemini excedido.')), ms); })]).finally(() => clearTimeout(timer));
}
function checkRateLimit(userId, now = Date.now()) {
  const recent = (rateBuckets.get(userId) || []).filter((time) => now - time < 60_000);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) return false;
  recent.push(now); rateBuckets.set(userId, recent); return true;
}
function serverConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  };
}
function createUserClient(url, key, token) {
  return createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
}
async function ensureConversation(db, userId, requestedId) {
  if (requestedId) {
    const row = fail(await db.from('chat_conversations').select('id').eq('id', requestedId).maybeSingle());
    if (!row) throw new Error('Conversa não encontrada ou não autorizada.');
    return row.id;
  }
  return fail(await db.from('chat_conversations').insert({ user_id: userId, title: 'Conversa acadêmica' }).select('id').single()).id;
}
async function saveMessage(db, conversationId, role, content, metadata = {}) {
  return fail(await db.from('chat_messages').insert({ conversation_id: conversationId, role, content, metadata }).select('id,created_at').single());
}
function systemInstruction() {
  return 'Você é o agente acadêmico TaskMind. Responda em português brasileiro. Use ferramentas para qualquer dado acadêmico do estudante; não invente prazos, notas, tarefas ou disciplinas. Se faltar informação obrigatória, peça esclarecimento. Operações de alteração serão apenas propostas e exigem confirmação humana. Seja conciso e diferencie sugestões de operações concluídas.';
}
function modelError(error) {
  const status = Number(error?.status);
  if (status === 401 || status === 403) return { status: 502, message: 'A autenticação do Gemini falhou no servidor.' };
  if (status === 429) return { status: 429, message: 'A cota do Gemini foi excedida. Tente novamente mais tarde.' };
  if (status === 404) return { status: 503, message: 'O modelo Gemini configurado não está disponível.' };
  if (status === 503) return { status: 503, message: 'O Gemini está temporariamente indisponível por alta demanda. Tente novamente em instantes.' };
  if (String(error?.message).includes('Tempo limite')) return { status: 504, message: error.message };
  return { status: 502, message: 'Falha ao processar a solicitação com o Gemini.' };
}
async function finalFromTool(ai, model, prompt, modelContent, call, result) {
  const contents = [
    { role: 'user', parts: [{ text: prompt }] },
    modelContent || { role: 'model', parts: [{ functionCall: call }] },
    { role: 'user', parts: [{ functionResponse: { id: call.id, name: call.name, response: { output: result } } }] },
  ];
  const response = await withTimeout(ai.models.generateContent({ model, contents, config: { systemInstruction: systemInstruction(), temperature: 0.2 } }));
  return response.text || 'A ferramenta foi executada, mas o modelo não produziu uma explicação.';
}

async function handleMessage({ body, db, opsDb = db, user, ai, model }) {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 4000) return { status: 400, payload: { error: 'Mensagem vazia ou acima de 4.000 caracteres.' } };
  const conversationId = await ensureConversation(db, user.id, body.conversationId);
  const historyRows = fail(await db.from('chat_messages').select('role,content,created_at').eq('conversation_id', conversationId).in('role', ['user', 'assistant']).order('created_at', { ascending: false }).limit(12));
  const contents = historyRows.reverse().map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
  contents.push({ role: 'user', parts: [{ text: prompt }] });
  await saveMessage(db, conversationId, 'user', prompt);
  const first = await withTimeout(ai.models.generateContent({ model, contents, config: { systemInstruction: systemInstruction(), tools: AGENT_TOOLS, temperature: 0.2 } }));
  const call = first.functionCalls?.[0];
  if (!call) {
    const content = first.text || 'Não consegui gerar uma resposta.';
    await saveMessage(db, conversationId, 'assistant', content);
    return { status: 200, payload: { content, conversationId } };
  }
  let args;
  try { args = validateToolCall(call.name, call.args || {}); } catch (error) {
    const content = `Não posso executar essa ferramenta: ${error.message}`;
    await saveMessage(db, conversationId, 'assistant', content, { tool: call.name, validationError: true });
    return { status: 422, payload: { error: content, conversationId } };
  }
  if (MUTATING_TOOLS.has(call.name)) {
    const normalized = await normalizeMutation(db, call.name, args);
    const operation = fail(await opsDb.from('agent_operations').insert({ user_id: user.id, conversation_id: conversationId, tool_name: call.name, arguments: normalized, original_prompt: prompt, function_call_id: call.id || null }).select('id,tool_name,arguments,status,created_at').single());
    const proposal = { id: operation.id, name: operation.tool_name, params: operation.arguments, requiresConfirmation: true, executed: false, label: `${operation.tool_name}: ${operation.arguments.title || operation.arguments.currentTask?.title || 'operação acadêmica'}` };
    const content = 'Preparei a operação abaixo. Revise exatamente os dados e confirme para gravar no Supabase.';
    await saveMessage(db, conversationId, 'assistant', content, { toolProposal: proposal });
    return { status: 200, payload: { content, conversationId, toolProposal: proposal } };
  }
  const result = await executeReadTool(db, call.name, args);
  const content = await finalFromTool(ai, model, prompt, first.candidates?.[0]?.content, call, result);
  await saveMessage(db, conversationId, 'tool', JSON.stringify(result), { tool: call.name });
  await saveMessage(db, conversationId, 'assistant', content, { tool: call.name });
  const studyPlan = call.name === 'suggestStudyPlan' ? { title: `Plano de estudo${result.subject?.name ? ` — ${result.subject.name}` : ''}`, description: content, stats: { totalTime: `${result.availableHours}h`, efficiency: 'Sugestão Gemini' }, steps: [] } : undefined;
  return { status: 200, payload: { content, conversationId, toolName: call.name, toolResult: result, studyPlan } };
}

async function handleConfirmation({ body, db, opsDb = db, user, ai, model }) {
  const operationId = typeof body.operationId === 'string' ? body.operationId : '';
  if (!operationId) return { status: 400, payload: { error: 'operationId é obrigatório.' } };
  const claimed = fail(await opsDb.from('agent_operations').update({ status: 'executing', confirmed_at: new Date().toISOString() }).eq('id', operationId).eq('user_id', user.id).eq('status', 'pending').select('*').maybeSingle());
  if (!claimed) {
    const existing = fail(await opsDb.from('agent_operations').select('status,result,error,conversation_id').eq('id', operationId).eq('user_id', user.id).maybeSingle());
    if (!existing) return { status: 404, payload: { error: 'Operação não encontrada ou não autorizada.' } };
    if (existing.status === 'completed') return { status: 409, payload: { error: 'Esta operação já foi executada.', alreadyExecuted: true, result: existing.result, conversationId: existing.conversation_id } };
    return { status: 409, payload: { error: `A operação não pode ser executada no estado ${existing.status}.` } };
  }
  let result;
  try {
    result = await executeMutation(db, claimed.tool_name, claimed.arguments);
    fail(await opsDb.from('agent_operations').update({ status: 'completed', result, executed_at: new Date().toISOString() }).eq('id', claimed.id).eq('user_id', user.id));
  } catch (error) {
    await opsDb.from('agent_operations').update({ status: 'failed', error: String(error.message).slice(0, 500) }).eq('id', claimed.id).eq('user_id', user.id);
    throw error;
  }
  const call = { id: claimed.function_call_id || randomUUID(), name: claimed.tool_name, args: claimed.arguments };
  let content;
  try { content = await finalFromTool(ai, model, claimed.original_prompt, null, call, result); }
  catch { content = 'A operação foi executada e persistida, mas o Gemini não conseguiu gerar a explicação final.'; }
  try {
    await saveMessage(db, claimed.conversation_id, 'tool', JSON.stringify(result), { tool: claimed.tool_name, operationId: claimed.id });
    await saveMessage(db, claimed.conversation_id, 'assistant', content, { operationId: claimed.id, executed: true });
  } catch { /* A mutação confirmada permanece concluída mesmo se o histórico falhar. */ }
  return { status: 200, payload: { content, conversationId: claimed.conversation_id, operationId: claimed.id, executed: true, result } };
}

export { checkRateLimit, handleConfirmation, handleMessage, modelError, withTimeout };

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return json(res, 401, { error: 'Sessão autenticada obrigatória.' });
  const config = serverConfig();
  if (!config.supabaseUrl || !config.supabaseKey) return json(res, 503, { error: 'Supabase não configurado no servidor.' });
  if (!config.secretKey) return json(res, 503, { error: 'SUPABASE_SECRET_KEY não configurada no servidor.' });
  if (!config.geminiKey) return json(res, 503, { error: 'Gemini não configurado no servidor.' });
  const db = createUserClient(config.supabaseUrl, config.supabaseKey, token);
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return json(res, 401, { error: 'Sessão inválida ou expirada.' });
  if (!checkRateLimit(user.id)) return json(res, 429, { error: 'Limite de solicitações excedido. Aguarde um minuto.' });
  const ai = new GoogleGenAI({ apiKey: config.geminiKey });
  const opsDb = createClient(config.supabaseUrl, config.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const action = req.body?.action || 'message';
    const result = action === 'confirm'
      ? await handleConfirmation({ body: req.body || {}, db, opsDb, user, ai, model: config.model })
      : await handleMessage({ body: req.body || {}, db, opsDb, user, ai, model: config.model });
    return json(res, result.status, result.payload);
  } catch (error) {
    if (error?.status || /Gemini|modelo|quota|cota/i.test(error?.message || '')) { const mapped = modelError(error); return json(res, mapped.status, { error: mapped.message }); }
    return json(res, 500, { error: error instanceof Error ? error.message : 'Erro interno do agente.' });
  }
}
