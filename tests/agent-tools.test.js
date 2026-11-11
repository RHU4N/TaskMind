import test from 'node:test';
import assert from 'node:assert/strict';
import agentHandler, { checkRateLimit, handleConfirmation, modelError, withTimeout } from '../api/agent.js';
import { validateToolCall } from '../api/lib/agentTools.js';

test('validação server-side aceita apenas campos e enums permitidos', () => {
  assert.deepEqual(validateToolCall('createTask', { title: 'Estudar Nuvem', priority: 'alta', ignored: 'não deve passar' }), { title: 'Estudar Nuvem', priority: 'alta' });
  assert.throws(() => validateToolCall('createTask', { title: 'x', priority: 'admin' }), /Prioridade inválida/);
  assert.throws(() => validateToolCall('unknownTool', {}), /não permitida/);
});

test('alterações exigem identificadores UUID válidos e campos explícitos', () => {
  assert.throws(() => validateToolCall('deleteTask', { taskId: 'task-1' }), /taskId inválido/);
  assert.throws(() => validateToolCall('updateTask', { taskId: '11111111-1111-4111-8111-111111111111' }), /pelo menos um campo/);
  assert.equal(validateToolCall('updateTask', { taskId: '11111111-1111-4111-8111-111111111111', status: 'completed' }).status, 'completed');
});

test('datas inválidas e horas irreais são rejeitadas', () => {
  assert.throws(() => validateToolCall('createTask', { title: 'Prova', dueDate: 'amanhã talvez' }), /data ISO válida/);
  assert.throws(() => validateToolCall('suggestStudyPlan', { availableHours: 100 }), /entre 0 e 80/);
});

test('limite por usuário bloqueia a décima terceira chamada no minuto', () => {
  const user = `user-${Date.now()}`;
  for (let index = 0; index < 12; index += 1) assert.equal(checkRateLimit(user, 1000 + index), true);
  assert.equal(checkRateLimit(user, 2000), false);
  assert.equal(checkRateLimit(user, 62001), true);
});

test('timeout encerra chamadas externas demoradas', async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 5), /Tempo limite/);
});

test('erros de quota, modelo e alta demanda têm respostas claras', () => {
  assert.equal(modelError({ status: 429 }).status, 429);
  assert.match(modelError({ status: 404 }).message, /modelo/i);
  assert.match(modelError({ status: 503 }).message, /alta demanda/i);
});

test('rota do agente recusa requisições sem sessão antes de acessar serviços externos', async () => {
  let statusCode; let payload;
  const res = { status(code) { statusCode = code; return this; }, json(body) { payload = body; return body; } };
  await agentHandler({ method: 'POST', headers: {}, body: { prompt: 'Liste tarefas' } }, res);
  assert.equal(statusCode, 401);
  assert.match(payload.error, /Sessão autenticada/);
});

function fakeConfirmationDatabase() {
  const state = { operation: { id: '11111111-1111-4111-8111-111111111111', user_id: '44444444-4444-4444-8444-444444444444', status: 'pending', tool_name: 'createTask', arguments: { title: 'Estudar Nuvem', priority: 'alta', subjectId: null }, original_prompt: 'Crie a tarefa', function_call_id: 'call-1', conversation_id: '22222222-2222-4222-8222-222222222222' }, taskInserts: 0 };
  const conditional = (kind, patch) => {
    const conditions = [];
    const chain = {
      eq(field, value) { conditions.push([field, value]); return chain; },
      select() { return chain; },
      async maybeSingle() {
        const matches = conditions.every(([field, value]) => state.operation[field] === value);
        if (!matches) return { data: null, error: null };
        if (kind === 'update') Object.assign(state.operation, patch);
        return { data: { ...state.operation }, error: null };
      },
      then(resolve, reject) {
        const matches = conditions.every(([field, value]) => state.operation[field] === value);
        if (matches && kind === 'update') Object.assign(state.operation, patch);
        return Promise.resolve({ data: matches ? { ...state.operation } : null, error: null }).then(resolve, reject);
      },
    };
    return chain;
  };
  return {
    state,
    db: { from(table) {
      if (table === 'agent_operations') return { update: (patch) => conditional('update', patch), select: () => conditional('select') };
      if (table === 'tasks') return { insert: (row) => ({ select: () => ({ single: async () => { state.taskInserts += 1; return { data: { id: '33333333-3333-4333-8333-333333333333', ...row }, error: null }; } }) }) };
      if (table === 'chat_messages') return { insert: () => ({ select: () => ({ single: async () => ({ data: { id: crypto.randomUUID(), created_at: new Date().toISOString() }, error: null }) }) }) };
      throw new Error(`Tabela inesperada: ${table}`);
    } },
  };
}

test('confirmação server-side executa a mutação uma única vez', async () => {
  const { db, state } = fakeConfirmationDatabase();
  const ai = { models: { generateContent: async () => ({ text: 'Tarefa criada e persistida.' }) } };
  const user = { id: state.operation.user_id };
  const first = await handleConfirmation({ body: { operationId: state.operation.id }, db, user, ai, model: 'test-model' });
  const second = await handleConfirmation({ body: { operationId: state.operation.id }, db, user, ai, model: 'test-model' });
  assert.equal(first.status, 200);
  assert.equal(second.status, 409);
  assert.equal(second.payload.alreadyExecuted, true);
  assert.equal(state.taskInserts, 1);
});
