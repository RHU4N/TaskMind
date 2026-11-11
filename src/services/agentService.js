/**
 * @file agentService.js
 * TaskMind AI Agent Architecture — Phase 1 Preparation Module.
 *
 * Implements local rule-based intent parsing and tool action proposals
 * with mandatory human-in-the-loop validation for Phase 1.
 * Prepares the multi-step agentic workflow for future Gemini API integration:
 * 1. User natural language prompt
 * 2. Intent extraction & tool selection (Phase 1: local rules; Phase 2: Gemini tool calling)
 * 3. Client/server schema validation
 * 4. Human-in-the-loop confirmation before data-changing actions
 * 5. Execution against shared state
 * 6. Audit & response synthesis
 */

import { isSupabaseConfigured, supabase } from './supabaseClient.js';

// Tool definitions are mirrored on the server; only the server copy is authoritative.
export const AGENT_TOOLS_DEFINITIONS = [
  {
    name: 'createTask',
    description: 'Cria uma nova tarefa acadêmica vinculada a uma disciplina com prazo e prioridade.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Título claro da entrega acadêmica.' },
        subjectName: { type: 'STRING', description: 'Nome ou código da disciplina.' },
        dueDate: { type: 'STRING', description: 'Data e hora no formato ISO 8601 ou nulo se não fornecido.' },
        priority: {
          type: 'STRING',
          enum: ['urgente', 'alta', 'media', 'baixa'],
          description: 'Nível de prioridade da tarefa.',
        },
        estimatedTime: { type: 'STRING', description: 'Tempo estimado (ex: 1h 30m).' },
        description: { type: 'STRING', description: 'Observações ou instruções da atividade.' },
        subtasks: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Lista de subtarefas informadas pelo usuário.',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'listTasks',
    description: 'Lista as tarefas acadêmicas filtrando por status, disciplina ou prioridade.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['all', 'pending', 'in_progress', 'completed', 'overdue'] },
        subjectName: { type: 'STRING', description: 'Filtrar por disciplina específica.' },
        priority: { type: 'STRING', enum: ['urgente', 'alta', 'media', 'baixa'] },
      },
    },
  },
  {
    name: 'updateTask',
    description: 'Atualiza o status, prazo ou dados de uma tarefa existente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        taskId: { type: 'STRING', description: 'ID da tarefa a ser modificada.' },
        status: { type: 'STRING', enum: ['pending', 'in_progress', 'completed'] },
        dueDate: { type: 'STRING', description: 'Novo prazo.' },
      },
      required: ['taskId'],
    },
  },
  {
    name: 'suggestStudyPlan',
    description: 'Gera uma proposta de plano de estudo estruturado para uma matéria.',
    parameters: {
      type: 'OBJECT',
      properties: {
        subjectName: { type: 'STRING', description: 'Disciplina alvo do estudo.' },
        topic: { type: 'STRING', description: 'Tópico ou matéria da atividade.' },
        availableHours: { type: 'NUMBER', description: 'Horas estimadas fornecidas pelo discente.' },
      },
      required: ['subjectName'],
    },
  },
];

/**
 * Agent Status & Metadata for UI feedback
 */
export const AGENT_CONFIG = {
  version: 'TaskMind Agent v2.0',
  backendStatus: 'server_authenticated',
  modelTarget: 'Configurado por GEMINI_MODEL no servidor',
  notice: 'Gemini com function calling, RLS e confirmação humana para alterações.',
};

/**
 * Extracts a task title from user natural language input.
 * Avoids hardcoding or fabricating unrequested tasks.
 *
 * @param {string} prompt
 * @returns {string|null} Extracted title or null if not identifiable
 */
export function extractTaskTitle(prompt) {
  if (!prompt || typeof prompt !== 'string') return null;
  const trimmed = prompt.trim();

  const patterns = [
    /(?:criar|adicionar|cadastrar|nova)\s+tarefa\s+(?:de|para|sobre|do|da)[:\s]+["']?([^"'\n\r]+?)["']?$/i,
    /(?:criar|adicionar|cadastrar|nova)\s+tarefa[:\s]+["']?([^"'\n\r]+?)["']?$/i,
    /checklist\s+(?:de|para|sobre|do|da)[:\s]+["']?([^"'\n\r]+?)["']?$/i,
    /checklist[:\s]+["']?([^"'\n\r]+?)["']?$/i,
    /tarefa[:\s]+["']?([^"'\n\r]+?)["']?$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].trim().length >= 2) {
      let cleaned = match[1].trim().replace(/^(?:de|para|sobre|do|da)\s+/i, '');
      cleaned = cleaned.replace(/[.?!]+$/, '').trim();
      if (cleaned.length >= 2) return cleaned;
    }
  }

  return null;
}

/**
 * Matches a subject name or code in text against current loaded subjects.
 *
 * @param {string} text
 * @param {Array} subjects
 * @returns {Object|null}
 */
export function matchSubjectInText(text, subjects = []) {
  if (!text || !subjects || subjects.length === 0) return null;
  const lower = text.toLowerCase();

  for (const subj of subjects) {
    if (!subj.name) continue;
    if (
      lower.includes(subj.name.toLowerCase()) ||
      (subj.code && lower.includes(subj.code.toLowerCase()))
    ) {
      return subj;
    }
  }
  return null;
}

/**
 * Process a user message in Phase 1:
 * Parses intents locally with rule-based heuristics, proposes tool actions
 * requiring human confirmation, and requests missing information without fabricating it.
 *
 * @param {string} prompt
 * @param {Object} contextData - { tasks: [], subjects: [] }
 * @returns {Promise<Object>}
 */
export async function processAgentMessage(prompt, contextData = {}) {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Sua sessão expirou. Entre novamente.');
    const response = await fetch('/api/agent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data?.session?.access_token || ''}` },
      body: JSON.stringify({ action: 'message', prompt, conversationId: contextData.conversationId || null }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Falha ao consultar o agente.');
    return { ...payload, notice: 'Resposta do Gemini com ferramentas executadas no servidor.' };
  }
  // Explicit demo/offline fallback below. It is never used for authenticated production sessions.
  const normalized = (prompt || '').toLowerCase().trim();
  const tasks = contextData.tasks || [];
  const subjects = contextData.subjects || [];

  // Intent 1: Resumos / Análise de Arquivos (PDF / Seminário)
  if (normalized.includes('resumir') || normalized.includes('seminário') || normalized.includes('pdf')) {
    return {
      type: 'assistant_response',
      content:
        'Identifiquei seu interesse em síntese de conteúdo acadêmico. Na Fase 1 do protótipo, a leitura de arquivos PDF e geração de resumos automatizados com o modelo multimodal Gemini não estão conectadas. Essa capacidade será introduzida na Fase 2 com processamento de anexos via backend.\n\nVocê pode consultar a ementa e os tópicos de estudo cadastrados diretamente na tela de Disciplinas.',
      toolProposal: null,
      contextFactors: [],
      notice: 'Motor de regras locais (Fase 1). Recursos de leitura de anexos e resumo via LLM não estão ativos.',
    };
  }

  // Intent 2: Reagendamento / Otimização de Prazos
  if (normalized.includes('reagendar') || normalized.includes('atrasad') || normalized.includes('estresse')) {
    const overdueList = tasks.filter((t) => t.isOverdue || t.status === 'overdue');
    const overdueCount = overdueList.length;

    if (overdueCount === 0) {
      return {
        type: 'assistant_response',
        content:
          'Verifiquei seu quadro atual de tarefas: você não possui nenhuma entrega com status de atraso no momento. Todas as suas atividades estão dentro dos prazos catalogados.',
        toolProposal: null,
        contextFactors: [],
        notice: 'Motor de regras locais (Fase 1). Dados obtidos do estado atual da aplicação.',
      };
    }

    const firstOverdue = overdueList[0];
    return {
      type: 'assistant_response',
      content: `Verifiquei que existem ${overdueCount} tarefa(s) pendente(s) com prazo vencido, incluindo "${firstOverdue.title}". Deseja reagendar para uma nova data? Como operamos com regras locais na Fase 1, você pode definir o novo prazo diretamente na edição da tarefa na tela "Minhas Tarefas".`,
      toolProposal: null,
      contextFactors: [
        { text: `${overdueCount} tarefa(s) atrasada(s) detectada(s)`, color: 'bg-rose-500' },
      ],
      notice: 'Motor de regras locais (Fase 1). Reagendamento inteligente automatizado via Tool Calling previsto para a Fase 2.',
    };
  }

  // Intent 3: Criação de Tarefa ou Checklist
  if (
    normalized.includes('criar') ||
    normalized.includes('adicionar') ||
    normalized.includes('cadastrar') ||
    normalized.includes('checklist') ||
    normalized.includes('tarefa')
  ) {
    const extractedTitle = extractTaskTitle(prompt);
    const matchedSubject = matchSubjectInText(prompt, subjects);

    // If user asked to create a task but didn't provide a title
    if (!extractedTitle) {
      return {
        type: 'assistant_response',
        content:
          'Compreendi que você deseja cadastrar uma nova tarefa acadêmica, mas o título não foi identificado na sua mensagem.\n\nPor favor, informe o nome da tarefa que deseja criar (ex: "Criar tarefa: Revisar Cap. 4 de Sistemas Distribuídos"). Se desejar, mencione também a disciplina associada.',
        toolProposal: null,
        contextFactors: [],
        notice: 'Motor de regras locais (Fase 1). Dados incompletos solicitados ao discente em vez de inventados.',
      };
    }

    // A valid title was extracted: prepare proposal without fabricating deadlines or subtasks
    const subjectName = matchedSubject ? matchedSubject.name : (subjects[0] ? subjects[0].name : 'Geral');
    const subjectId = matchedSubject ? matchedSubject.id : (subjects[0] ? subjects[0].id : '');

    return {
      type: 'assistant_response',
      content: `Identifiquei a proposta para criar a tarefa acadêmica: "${extractedTitle}".\n\n• Disciplina associada: ${subjectName}${
        !matchedSubject ? ' (atribuída por padrão; editável)' : ''
      }\n• Prazo de entrega: Não especificado na mensagem (poderá ser definido na tela de edição)\n\nConfirme abaixo para registrar a tarefa em sua grade:`,
      toolProposal: {
        id: `prop-${Date.now()}`,
        name: 'createTask',
        label: `Criar Tarefa: ${extractedTitle}`,
        requiresConfirmation: true,
        executed: false,
        params: {
          title: extractedTitle,
          subjectId: subjectId,
          subjectName: subjectName,
          dueDate: null, // Do not invent a deadline
          priority: 'media',
          estimatedTime: '1h 00m',
          description: `Tarefa registrada via proposta do assistente (Fase 1) a partir do pedido: "${prompt.trim()}".`,
          subtasks: [],
        },
      },
      contextFactors: matchedSubject
        ? [{ text: `Disciplina: ${matchedSubject.name}`, color: 'bg-primary' }]
        : [],
      notice: 'Motor de regras locais (Fase 1). A proposta requer confirmação humana antes de ser gravada.',
    };
  }

  // Fallback response for unhandled prompts
  return {
    type: 'assistant_response',
    content: `Recebi sua mensagem: "${prompt}".\n\nNesta Fase 1 do TaskMind, o assistente opera com um motor local determinístico de regras (sem modelo Gemini conectado). Para testar a criação de tarefas, digite por exemplo "Criar tarefa: [Nome da sua tarefa]".`,
    toolProposal: null,
    contextFactors: [],
    notice: 'Agente em modo arquitetural da Fase 1 (sem conexão externa ao Gemini).',
  };
}

export async function confirmAgentOperation(operationId) {
  if (!isSupabaseConfigured) throw new Error('Confirmação remota indisponível no modo demonstração.');
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Sua sessão expirou. Entre novamente.');
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ action: 'confirm', operationId }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Não foi possível executar a operação.');
  return payload;
}
