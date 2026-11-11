import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import {
  AGENT_TOOLS,
  MUTATING_TOOLS,
  buildStudyPlan,
  executeMutation,
  executeReadTool,
  normalizeMutation,
  validateToolCall,
} from './_lib/agentTools.js';

const rateBuckets = new Map();
const MAX_REQUESTS_PER_MINUTE = 12;
const MODEL_TIMEOUT_MS = 8_000;
const MAX_TOOL_ROUNDS = 4;
const DEFAULT_MODEL = 'gemini-3-flash-preview';
const FALLBACK_MODELS = ['gemini-3-flash-preview', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];

function json(res, status, payload) { return res.status(status).json(payload); }
function fail(result) { if (result.error) throw new Error(result.error.message); return result.data; }

function withTimeout(promise, ms = MODEL_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Tempo limite do Gemini excedido.')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function checkRateLimit(userId, now = Date.now()) {
  const recent = (rateBuckets.get(userId) || []).filter((time) => now - time < 60_000);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) return false;
  recent.push(now);
  rateBuckets.set(userId, recent);
  return true;
}

function serverConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    geminiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  };
}

function resolveModelCandidates(primaryModel = DEFAULT_MODEL) {
  const configuredFallbacks = (process.env.GEMINI_FALLBACK_MODELS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [...new Set([primaryModel, ...configuredFallbacks, ...FALLBACK_MODELS].filter(Boolean))];
}

function isNonFallbackError(error) {
  const status = Number(error?.status);
  return status === 400 || status === 401 || status === 403;
}

async function generateWithFallback(ai, modelOrCandidates, request, timeoutMs = MODEL_TIMEOUT_MS) {
  const candidates = Array.isArray(modelOrCandidates)
    ? modelOrCandidates
    : resolveModelCandidates(modelOrCandidates);

  let lastError;
  for (const candidate of candidates) {
    try {
      const response = await withTimeout(
        ai.models.generateContent({ ...request, model: candidate }),
        timeoutMs
      );
      return { response, modelUsed: candidate };
    } catch (error) {
      lastError = error;
      if (isNonFallbackError(error)) throw error;
    }
  }
  throw lastError;
}

function createUserClient(url, key, token) {
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function verifyConversationOwnership(db, requestedId) {
  if (!requestedId) return null;
  const row = fail(await db.from('chat_conversations').select('id').eq('id', requestedId).maybeSingle());
  if (!row) throw new Error('Conversa não encontrada ou não autorizada.');
  return row.id;
}

async function ensureConversation(db, userId, requestedId) {
  if (requestedId) return verifyConversationOwnership(db, requestedId);
  return fail(
    await db
      .from('chat_conversations')
      .insert({ user_id: userId, title: 'Conversa acadêmica' })
      .select('id')
      .single()
  ).id;
}

async function saveMessage(db, conversationId, role, content, metadata = {}) {
  return fail(
    await db
      .from('chat_messages')
      .insert({ conversation_id: conversationId, role, content, metadata })
      .select('id,created_at')
      .single()
  );
}

function systemInstruction() {
  const now = new Date();
  const localDate = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' });
  return [
    'Você é o agente acadêmico TaskMind. Responda em português brasileiro.',
    `Data e hora atual (America/Sao_Paulo): ${localDate} (ISO: ${now.toISOString()}).`,
    'Use ferramentas para qualquer dado acadêmico do estudante; não invente prazos, notas, tarefas ou disciplinas.',
    'Para atualizar/excluir uma tarefa ou calcular nota por disciplina, consulte primeiro listTasks ou listSubjects para obter o UUID real.',
    'Se faltar informação obrigatória, peça esclarecimento. Operações de alteração serão apenas propostas e exigem confirmação humana.',
    'Seja conciso, claro e diferencie sugestões de operações concluídas.',
  ].join(' ');
}

function modelError(error) {
  const status = Number(error?.status);
  const msg = String(error?.message || '');
  if (status === 401 || status === 403) return { status: 502, message: 'A autenticação do Gemini falhou no servidor.' };
  if (status === 429) return { status: 429, message: 'A cota do Gemini foi excedida. Tente novamente mais tarde.' };
  if (status === 404) return { status: 503, message: 'O modelo Gemini configurado não está disponível.' };
  if (status === 503) return { status: 503, message: 'O Gemini está temporariamente indisponível por alta demanda. Tente novamente em instantes.' };
  if (status === 504 || /Tempo limite|DEADLINE_EXCEEDED/i.test(msg)) return { status: 504, message: 'Tempo limite do Gemini excedido.' };
  return { status: 502, message: 'Falha ao processar a solicitação com o Gemini.' };
}

async function explainExecutedOperation(ai, model, originalPrompt, toolName, result) {
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: [
            `Pedido original do estudante: ${originalPrompt}`,
            `Operação confirmada e executada com sucesso no Supabase: ${toolName}`,
            `Dados reais persistidos: ${JSON.stringify(result)}`,
            'Confirme de forma clara, concisa e em português brasileiro o que foi realizado com base exclusivamente nesses dados.',
          ].join('\n'),
        },
      ],
    },
  ];
  const { response } = await generateWithFallback(ai, model, {
    contents,
    config: { systemInstruction: systemInstruction(), temperature: 0.2 },
  });
  return response.text || 'Operação executada e persistida com sucesso.';
}

async function persistTurn(db, userId, requestedConversationId, prompt, toolLogs, assistantContent, assistantMetadata = {}) {
  const conversationId = await ensureConversation(db, userId, requestedConversationId);
  await saveMessage(db, conversationId, 'user', prompt);
  for (const log of toolLogs) {
    await saveMessage(db, conversationId, 'tool', JSON.stringify(log.output), { tool: log.tool });
  }
  await saveMessage(db, conversationId, 'assistant', assistantContent, assistantMetadata);
  return conversationId;
}

async function handleMessage({ body, db, opsDb = db, user, ai, model }) {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt || prompt.length > 4000) return { status: 400, payload: { error: 'Mensagem vazia ou acima de 4.000 caracteres.' } };

  const verifiedConversationId = await verifyConversationOwnership(db, body.conversationId);
  const historyRows = verifiedConversationId
    ? fail(
        await db
          .from('chat_messages')
          .select('role,content,created_at')
          .eq('conversation_id', verifiedConversationId)
          .in('role', ['user', 'assistant'])
          .order('created_at', { ascending: false })
          .limit(12)
      )
    : [];

  const contents = historyRows
    .reverse()
    .map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
  contents.push({ role: 'user', parts: [{ text: prompt }] });

  const candidates = resolveModelCandidates(model);
  let activeModelList = candidates;
  const toolLogs = [];
  let lastToolMeta = {};
  let lastStudyPlanResult = null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const { response, modelUsed } = await generateWithFallback(ai, activeModelList, {
      contents,
      config: { systemInstruction: systemInstruction(), tools: AGENT_TOOLS, temperature: 0.2 },
    });
    activeModelList = [modelUsed, ...candidates.filter((c) => c !== modelUsed)];

    const calls = response.functionCalls || [];
    if (calls.length === 0) {
      const content = response.text || 'Não consegui gerar uma resposta.';
      const conversationId = await persistTurn(
        db,
        user.id,
        verifiedConversationId,
        prompt,
        toolLogs,
        content,
        lastToolMeta.toolName ? { tool: lastToolMeta.toolName } : {}
      );
      const studyPlan = lastStudyPlanResult ? buildStudyPlan(lastStudyPlanResult, content) : undefined;
      return {
        status: 200,
        payload: {
          content,
          conversationId,
          modelUsed,
          ...lastToolMeta,
          ...(studyPlan ? { studyPlan } : {}),
        },
      };
    }

    const modelContent = response.candidates?.[0]?.content || {
      role: 'model',
      parts: calls.map((c) => ({ functionCall: c })),
    };

    const mutatingCall = calls.find((c) => MUTATING_TOOLS.has(c.name));
    if (mutatingCall) {
      let normalized;
      try {
        const args = validateToolCall(mutatingCall.name, mutatingCall.args || {});
        normalized = await normalizeMutation(db, mutatingCall.name, args);
      } catch (error) {
        // Feed validation/lookup error back to Gemini so it can self-correct (e.g. listSubjects) or ask user.
        contents.push(modelContent);
        contents.push({
          role: 'user',
          parts: calls.map((c) => ({
            functionResponse: {
              id: c.id,
              name: c.name,
              response: {
                output: c === mutatingCall
                  ? { error: error.message }
                  : { error: 'Operação ignorada até validar a ação principal.' },
              },
            },
          })),
        });
        continue;
      }

      const conversationId = await ensureConversation(db, user.id, verifiedConversationId);
      await saveMessage(db, conversationId, 'user', prompt);
      for (const log of toolLogs) {
        await saveMessage(db, conversationId, 'tool', JSON.stringify(log.output), { tool: log.tool });
      }
      const operation = fail(
        await opsDb
          .from('agent_operations')
          .insert({
            user_id: user.id,
            conversation_id: conversationId,
            tool_name: mutatingCall.name,
            arguments: normalized,
            original_prompt: prompt,
            function_call_id: mutatingCall.id || null,
          })
          .select('id,tool_name,arguments,status,created_at')
          .single()
      );
      const proposal = {
        id: operation.id,
        name: operation.tool_name,
        params: operation.arguments,
        requiresConfirmation: true,
        executed: false,
        label: `${operation.tool_name}: ${operation.arguments.title || operation.arguments.currentTask?.title || 'operação acadêmica'}`,
      };
      const content = 'Preparei a operação abaixo. Revise exatamente os dados e confirme para gravar no Supabase.';
      await saveMessage(db, conversationId, 'assistant', content, { toolProposal: proposal });
      return { status: 200, payload: { content, conversationId, toolProposal: proposal, modelUsed } };
    }

    // All calls are read tools.
    contents.push(modelContent);
    const responseParts = [];
    for (const call of calls) {
      let output;
      try {
        const args = validateToolCall(call.name, call.args || {});
        output = await executeReadTool(db, call.name, args);
        toolLogs.push({ tool: call.name, output });
        lastToolMeta = { toolName: call.name, toolResult: output };
        if (call.name === 'suggestStudyPlan') lastStudyPlanResult = output;
      } catch (error) {
        output = { error: error.message };
      }
      responseParts.push({ functionResponse: { id: call.id, name: call.name, response: { output } } });
    }
    contents.push({ role: 'user', parts: responseParts });
  }

  // Final synthesis pass if all tool rounds were used.
  const { response, modelUsed } = await generateWithFallback(ai, activeModelList, {
    contents,
    config: { systemInstruction: systemInstruction(), temperature: 0.2 },
  });
  const content = response.text || 'Consultei seus dados, mas não foi possível concluir a explicação.';
  const conversationId = await persistTurn(
    db,
    user.id,
    verifiedConversationId,
    prompt,
    toolLogs,
    content,
    lastToolMeta.toolName ? { tool: lastToolMeta.toolName } : {}
  );
  const studyPlan = lastStudyPlanResult ? buildStudyPlan(lastStudyPlanResult, content) : undefined;
  return {
    status: 200,
    payload: { content, conversationId, modelUsed, ...lastToolMeta, ...(studyPlan ? { studyPlan } : {}) },
  };
}

async function handleConfirmation({ body, db, opsDb = db, user, ai, model }) {
  const operationId = typeof body.operationId === 'string' ? body.operationId : '';
  if (!operationId) return { status: 400, payload: { error: 'operationId é obrigatório.' } };
  const claimed = fail(
    await opsDb
      .from('agent_operations')
      .update({ status: 'executing', confirmed_at: new Date().toISOString() })
      .eq('id', operationId)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select('*')
      .maybeSingle()
  );
  if (!claimed) {
    const existing = fail(
      await opsDb
        .from('agent_operations')
        .select('status,result,error,conversation_id')
        .eq('id', operationId)
        .eq('user_id', user.id)
        .maybeSingle()
    );
    if (!existing) return { status: 404, payload: { error: 'Operação não encontrada ou não autorizada.' } };
    if (existing.status === 'completed') {
      return {
        status: 409,
        payload: {
          error: 'Esta operação já foi executada.',
          alreadyExecuted: true,
          result: existing.result,
          conversationId: existing.conversation_id,
        },
      };
    }
    return { status: 409, payload: { error: `A operação não pode ser executada no estado ${existing.status}.` } };
  }
  let result;
  try {
    result = await executeMutation(db, claimed.tool_name, claimed.arguments);
    fail(
      await opsDb
        .from('agent_operations')
        .update({ status: 'completed', result, executed_at: new Date().toISOString() })
        .eq('id', claimed.id)
        .eq('user_id', user.id)
    );
  } catch (error) {
    await opsDb
      .from('agent_operations')
      .update({ status: 'failed', error: String(error.message).slice(0, 500) })
      .eq('id', claimed.id)
      .eq('user_id', user.id);
    throw error;
  }
  let content;
  try {
    content = await explainExecutedOperation(ai, model, claimed.original_prompt, claimed.tool_name, result);
  } catch {
    content = 'A operação foi executada e persistida, mas o Gemini não conseguiu gerar a explicação final.';
  }
  try {
    await saveMessage(db, claimed.conversation_id, 'tool', JSON.stringify(result), {
      tool: claimed.tool_name,
      operationId: claimed.id,
    });
    await saveMessage(db, claimed.conversation_id, 'assistant', content, {
      operationId: claimed.id,
      executed: true,
    });
  } catch {
    /* A mutação confirmada permanece concluída mesmo se o histórico falhar. */
  }
  return { status: 200, payload: { content, conversationId: claimed.conversation_id, operationId: claimed.id, executed: true, result } };
}

export {
  checkRateLimit,
  generateWithFallback,
  handleConfirmation,
  handleMessage,
  modelError,
  resolveModelCandidates,
  withTimeout,
};

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
  const ai = new GoogleGenAI({ apiKey: config.geminiKey, httpOptions: { timeout: MODEL_TIMEOUT_MS } });
  const opsDb = createClient(config.supabaseUrl, config.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    const action = req.body?.action || 'message';
    const result = action === 'confirm'
      ? await handleConfirmation({ body: req.body || {}, db, opsDb, user, ai, model: config.model })
      : await handleMessage({ body: req.body || {}, db, opsDb, user, ai, model: config.model });
    return json(res, result.status, result.payload);
  } catch (error) {
    if (error?.status || /Gemini|modelo|quota|cota|Tempo limite|DEADLINE_EXCEEDED/i.test(error?.message || '')) {
      const mapped = modelError(error);
      return json(res, mapped.status, { error: mapped.message });
    }
    return json(res, 500, { error: error instanceof Error ? error.message : 'Erro interno do agente.' });
  }
}
