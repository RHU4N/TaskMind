import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateWithFallback,
  handleMessage,
  modelError,
  resolveModelCandidates,
} from '../api/agent.js';
import { buildStudyPlan, executeReadTool, normalizeMutation } from '../api/_lib/agentTools.js';
import { parseAuthUrlError, translateAuthError } from '../src/utils/authMessages.js';

test('resolveModelCandidates coloca o modelo primário primeiro e remove duplicatas', () => {
  const list = resolveModelCandidates('gemini-3-flash-preview');
  assert.equal(list[0], 'gemini-3-flash-preview');
  assert.equal(new Set(list).size, list.length);
  assert.ok(list.includes('gemini-3.1-flash-lite'));
});

test('generateWithFallback faz fallback automático após 504 ou 503', async () => {
  const tried = [];
  const ai = {
    models: {
      async generateContent({ model }) {
        tried.push(model);
        if (model === 'gemini-3.8-flash') {
          const err = new Error('Deadline expired');
          err.status = 504;
          throw err;
        }
        return { text: 'Resposta ok' };
      },
    },
  };

  const result = await generateWithFallback(ai, 'gemini-3.8-flash', { contents: 'Olá' }, 500);
  assert.equal(result.modelUsed, 'gemini-3-flash-preview');
  assert.equal(result.response.text, 'Resposta ok');
  assert.deepEqual(tried, ['gemini-3.8-flash', 'gemini-3-flash-preview']);
});

test('generateWithFallback não mascara erro de autenticação 401', async () => {
  const tried = [];
  const ai = {
    models: {
      async generateContent({ model }) {
        tried.push(model);
        const err = new Error('API key invalid');
        err.status = 401;
        throw err;
      },
    },
  };

  await assert.rejects(
    generateWithFallback(ai, 'gemini-3.8-flash', { contents: 'Olá' }, 500),
    /API key invalid/
  );
  assert.deepEqual(tried, ['gemini-3.8-flash']);
});

test('modelError mapeia 504 e DEADLINE_EXCEEDED para HTTP 504', () => {
  assert.equal(modelError({ status: 504 }).status, 504);
  assert.equal(modelError({ message: 'DEADLINE_EXCEEDED' }).status, 504);
});

function createAgentMockDb({ subjects = [], tasks = [] } = {}) {
  const messages = [];
  const conversations = [{ id: '11111111-1111-4111-8111-111111111111' }];
  const operations = [];

  const makeSubjectsQuery = () => ({
    select() { return this; },
    order: async () => ({ data: subjects, error: null }),
    eq() { return this; },
    maybeSingle: async () => ({ data: subjects[0] || null, error: null }),
  });

  const makeTasksQuery = () => {
    const chain = {
      select() { return chain; },
      eq() { return chain; },
      neq() { return chain; },
      lt() { return chain; },
      lte() { return chain; },
      order() { return chain; },
      limit() { return chain; },
      maybeSingle: async () => ({ data: tasks[0] || null, error: null }),
      then(resolve, reject) {
        return Promise.resolve({ data: tasks, error: null }).then(resolve, reject);
      },
    };
    return chain;
  };

  return {
    messages,
    operations,
    db: {
      from(table) {
        if (table === 'chat_conversations') {
          return {
            select() {
              return {
                eq() {
                  return {
                    maybeSingle: async () => ({ data: conversations[0], error: null }),
                  };
                },
              };
            },
            insert: () => ({
              select: () => ({
                single: async () => {
                  const id = '11111111-1111-4111-8111-111111111111';
                  conversations.push({ id });
                  return { data: { id }, error: null };
                },
              }),
            }),
          };
        }
        if (table === 'chat_messages') {
          return {
            select() {
              return {
                eq() { return this; },
                in() { return this; },
                order() { return this; },
                limit: async () => ({ data: [], error: null }),
              };
            },
            insert: (row) => ({
              select: () => ({
                single: async () => {
                  const saved = { id: `m-${messages.length + 1}`, created_at: new Date().toISOString(), ...row };
                  messages.push(saved);
                  return { data: saved, error: null };
                },
              }),
            }),
          };
        }
        if (table === 'subjects') return makeSubjectsQuery();
        if (table === 'tasks') return makeTasksQuery();
        if (table === 'agent_operations') {
          return {
            insert: (row) => ({
              select: () => ({
                single: async () => {
                  const saved = { id: '22222222-2222-4222-8222-222222222222', status: 'pending', created_at: new Date().toISOString(), ...row };
                  operations.push(saved);
                  return { data: saved, error: null };
                },
              }),
            }),
          };
        }
        throw new Error(`Tabela inesperada: ${table}`);
      },
    },
  };
}

test('handleMessage suporta encadeamento de ferramentas de leitura e gera studyPlan com etapas', async () => {
  const subjects = [
    {
      id: '33333333-3333-4333-8333-333333333333',
      code: 'CC320',
      name: 'Banco de Dados II',
      credits: 4,
      current_grade: 8.2,
      assessments: [
        { id: 'a1', name: 'TP1', weight: 0.4, grade: 8.0, status: 'completed' },
        { id: 'a2', name: 'P1', weight: 0.6, grade: null, status: 'pending' },
      ],
    },
  ];
  const tasks = [
    { id: '44444444-4444-4444-8444-444444444444', title: 'Revisar Índices B+', status: 'pending', priority: 'alta', due_date: null, subjects: { name: 'Banco de Dados II' } },
  ];
  const { db, messages } = createAgentMockDb({ subjects, tasks });

  let step = 0;
  const ai = {
    models: {
      async generateContent() {
        step += 1;
        if (step === 1) {
          return { functionCalls: [{ id: 'c1', name: 'listSubjects', args: {} }] };
        }
        if (step === 2) {
          return { functionCalls: [{ id: 'c2', name: 'suggestStudyPlan', args: { subjectName: 'Banco de Dados', availableHours: 3 } }] };
        }
        return { text: 'Organizei um plano de 3h focado em Índices B+ para Banco de Dados II.' };
      },
    },
  };

  const res = await handleMessage({
    body: { prompt: 'Monte um plano de 3h para Banco de Dados' },
    db,
    user: { id: 'user-1' },
    ai,
    model: 'gemini-3-flash-preview',
  });

  assert.equal(res.status, 200);
  assert.match(res.payload.content, /Banco de Dados II/);
  assert.equal(res.payload.studyPlan.steps.length, 1);
  assert.equal(res.payload.studyPlan.steps[0].title, 'Revisar Índices B+');
  assert.equal(messages.filter((m) => m.role === 'user').length, 1);
  assert.equal(messages.filter((m) => m.role === 'assistant').length, 1);
});

test('handleMessage não grava mensagem órfã se todas as chamadas ao Gemini falharem', async () => {
  const { db, messages } = createAgentMockDb();
  const ai = {
    models: {
      async generateContent() {
        const err = new Error('DEADLINE_EXCEEDED');
        err.status = 504;
        throw err;
      },
    },
  };

  await assert.rejects(
    handleMessage({
      body: { prompt: 'Olá IA' },
      db,
      user: { id: 'user-1' },
      ai,
      model: 'gemini-3-flash-preview',
    }),
    /DEADLINE_EXCEEDED/
  );
  assert.equal(messages.length, 0);
});

test('resolveSubject aceita correspondência parcial e código da disciplina', async () => {
  const subjects = [
    { id: '33333333-3333-4333-8333-333333333333', code: 'CC320', name: 'Banco de Dados II' },
  ];
  const { db } = createAgentMockDb({ subjects });
  const normalizedByPartial = await normalizeMutation(db, 'createTask', { title: 'Lista 1', priority: 'media', subjectName: 'banco de dados' });
  assert.equal(normalizedByPartial.subjectId, '33333333-3333-4333-8333-333333333333');
  assert.equal(normalizedByPartial.subjectName, 'Banco de Dados II');

  const listed = await executeReadTool(db, 'listTasks', { subjectName: 'CC320' });
  assert.ok(Array.isArray(listed.tasks));

  const emptyPlan = buildStudyPlan({ availableHours: 2, topic: 'Grafos', openTasks: [] }, 'Plano criado');
  assert.equal(emptyPlan.steps.length, 1);
  assert.equal(emptyPlan.steps[0].title, 'Grafos');
});

test('translateAuthError e parseAuthUrlError traduzem mensagens do Supabase para PT-BR', () => {
  assert.equal(translateAuthError('Invalid login credentials').needsConfirmation, false);
  assert.match(translateAuthError('Invalid login credentials').message, /E-mail ou senha incorretos/);

  const unconfirmed = translateAuthError('Email not confirmed');
  assert.equal(unconfirmed.needsConfirmation, true);
  assert.match(unconfirmed.message, /ainda não foi confirmado/);

  assert.match(translateAuthError('User already registered').message, /já está cadastrado/);

  const urlErr = parseAuthUrlError(
    'http://localhost:3000/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'
  );
  assert.match(urlErr, /expirou/);
  assert.equal(parseAuthUrlError('http://localhost:3000/'), null);
});
