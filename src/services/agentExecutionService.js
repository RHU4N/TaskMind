/**
 * @file agentExecutionService.js
 * Production validation guards and execution safety for TaskMind Agent tool proposals.
 * Provides pure, testable validation for Human-in-the-Loop confirmations,
 * double execution prevention, duplicate task protection, and tool verification.
 */

export const SUPPORTED_AGENT_TOOLS = ['createTask', 'suggestStudyPlan'];

/**
 * Validates whether a proposed tool action is eligible for execution.
 *
 * @param {Object} params
 * @param {Object} params.proposal - The proposed tool object from agentService
 * @param {Array} [params.existingTasks=[]] - Current array of tasks in application state
 * @param {Array} [params.supportedTools=SUPPORTED_AGENT_TOOLS] - Allowed tool names
 * @param {number} [params.duplicateThresholdMs=30000] - Window in ms to check for duplicate task titles
 * @returns {{ valid: boolean, error?: string, isDuplicate?: boolean, unsupported?: boolean }}
 */
export function validateProposalExecution({
  proposal,
  existingTasks = [],
  supportedTools = SUPPORTED_AGENT_TOOLS,
  duplicateThresholdMs = 30000,
}) {
  if (!proposal || typeof proposal !== 'object') {
    return { valid: false, error: 'Proposta inválida ou ausente.' };
  }

  // 1. Guard against double execution / repeated confirmations
  if (proposal.executed) {
    return { valid: false, error: 'Esta ação já foi executada anteriormente.' };
  }

  // 2. Guard against unsupported or unknown actions
  if (!proposal.name || !supportedTools.includes(proposal.name)) {
    return {
      valid: false,
      error: `Ferramenta "${proposal.name || 'desconhecida'}" não suportada na Fase 1.`,
      unsupported: true,
    };
  }

  // 3. Tool-specific parameter validation
  if (proposal.name === 'createTask') {
    const params = proposal.params || {};
    const title = (params.title || '').trim();

    if (!title) {
      return { valid: false, error: 'Título da tarefa não fornecido.' };
    }

    // Check duplicate protection against existing tasks
    const now = Date.now();
    const isDuplicate = existingTasks.some((t) => {
      if (!t || !t.title) return false;
      const sameTitle = t.title.toLowerCase().trim() === title.toLowerCase().trim();
      const taskCreationTime = t.createdAt
        ? new Date(t.createdAt).getTime()
        : t.id && t.id.startsWith('task-')
        ? Number(t.id.replace('task-', ''))
        : 0;
      const isRecent = taskCreationTime > 0 && now - taskCreationTime < duplicateThresholdMs;
      return sameTitle && isRecent;
    });

    if (isDuplicate) {
      return { valid: false, error: 'Tarefa duplicada evitada.', isDuplicate: true };
    }
  }

  return { valid: true };
}

/**
 * Prepares a sanitized task object from a validated createTask proposal.
 * Preserves dueDate as null when omitted or invalid.
 *
 * @param {Object} proposal
 * @param {Array} [subjects=[]]
 * @returns {Object} Task creation payload
 */
export function prepareTaskFromProposal(proposal, subjects = []) {
  const params = proposal?.params || {};
  const title = (params.title || '').trim();
  const matchedSubject = subjects.find((s) => s.id === params.subjectId) || subjects[0];

  return {
    title,
    subjectId: params.subjectId || (matchedSubject ? matchedSubject.id : ''),
    subjectName: params.subjectName || (matchedSubject ? matchedSubject.name : 'Geral'),
    dueDate: params.dueDate ? params.dueDate : null,
    priority: params.priority || 'media',
    estimatedTime: params.estimatedTime || '1h 00m',
    description: params.description || '',
    subtasks: (params.subtasks || []).map((st, i) => ({
      id: `st-${Date.now()}-${i}`,
      text: typeof st === 'string' ? st : st.text || 'Etapa',
      completed: false,
    })),
    isAiPrioritized: true,
    hasAiBadge: true,
    aiBadgeText: 'Agente Criou',
  };
}

/**
 * Marks a proposal object as executed in place.
 *
 * @param {Object} proposal
 * @returns {Object} The updated proposal
 */
export function markProposalExecuted(proposal) {
  if (proposal && typeof proposal === 'object') {
    proposal.executed = true;
    proposal.executedAt = new Date().toISOString();
  }
  return proposal;
}
