import { Type } from '@google/genai';
import { calculateSimulatorGrade } from '../../src/utils/academicCalculations.js';

const PRIORITIES = ['urgente', 'alta', 'media', 'baixa'];
const STATUSES = ['pending', 'in_progress', 'completed'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MUTATING_TOOLS = new Set(['createTask', 'updateTask', 'deleteTask']);

export const AGENT_TOOLS = [{ functionDeclarations: [
  { name: 'listTasks', description: 'Consulta tarefas reais do estudante com filtros opcionais.', parameters: { type: Type.OBJECT, properties: { status: { type: Type.STRING, enum: [...STATUSES, 'overdue'] }, priority: { type: Type.STRING, enum: PRIORITIES }, subjectName: { type: Type.STRING }, dueBefore: { type: Type.STRING, description: 'Data ISO 8601.' } } } },
  { name: 'createTask', description: 'Prepara uma proposta de nova tarefa. Não executa sem confirmação humana.', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, subjectName: { type: Type.STRING }, dueDate: { type: Type.STRING }, priority: { type: Type.STRING, enum: PRIORITIES }, description: { type: Type.STRING } }, required: ['title'] } },
  { name: 'updateTask', description: 'Prepara alteração de tarefa. Não executa sem confirmação humana.', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING }, status: { type: Type.STRING, enum: STATUSES }, dueDate: { type: Type.STRING }, priority: { type: Type.STRING, enum: PRIORITIES }, description: { type: Type.STRING }, title: { type: Type.STRING } }, required: ['taskId'] } },
  { name: 'deleteTask', description: 'Prepara exclusão de tarefa. Sempre exige confirmação humana.', parameters: { type: Type.OBJECT, properties: { taskId: { type: Type.STRING } }, required: ['taskId'] } },
  { name: 'listSubjects', description: 'Consulta as disciplinas reais cadastradas.', parameters: { type: Type.OBJECT, properties: {} } },
  { name: 'suggestStudyPlan', description: 'Obtém dados reais para elaborar um plano de estudos sem alterar o banco.', parameters: { type: Type.OBJECT, properties: { subjectName: { type: Type.STRING }, availableHours: { type: Type.NUMBER }, topic: { type: Type.STRING } }, required: ['availableHours'] } },
  { name: 'calculateRequiredGrade', description: 'Calcula deterministicamente a nota necessária usando avaliações reais.', parameters: { type: Type.OBJECT, properties: { subjectId: { type: Type.STRING }, targetAverage: { type: Type.NUMBER } }, required: ['subjectId'] } },
  { name: 'getAcademicOverview', description: 'Consulta um resumo acadêmico real do estudante.', parameters: { type: Type.OBJECT, properties: {} } },
] }];

function text(value, field, { required = false, max = 500 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new Error(`O campo ${field} é obrigatório.`);
    return undefined;
  }
  if (typeof value !== 'string') throw new Error(`O campo ${field} deve ser texto.`);
  const clean = value.trim();
  if (!clean && required) throw new Error(`O campo ${field} é obrigatório.`);
  if (clean.length > max) throw new Error(`O campo ${field} excede ${max} caracteres.`);
  return clean || undefined;
}

function isoDate(value, field) {
  const clean = text(value, field);
  if (!clean) return undefined;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(`O campo ${field} deve conter uma data ISO válida.`);
  return parsed.toISOString();
}

export function validateToolCall(name, input = {}) {
  if (!AGENT_TOOLS[0].functionDeclarations.some((tool) => tool.name === name)) throw new Error('Ferramenta não permitida.');
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Argumentos inválidos.');
  switch (name) {
    case 'listTasks': {
      const args = {};
      if (input.status !== undefined) { if (![...STATUSES, 'overdue'].includes(input.status)) throw new Error('Status inválido.'); args.status = input.status; }
      if (input.priority !== undefined) { if (!PRIORITIES.includes(input.priority)) throw new Error('Prioridade inválida.'); args.priority = input.priority; }
      const subjectName = text(input.subjectName, 'subjectName', { max: 160 }); if (subjectName) args.subjectName = subjectName;
      const dueBefore = isoDate(input.dueBefore, 'dueBefore'); if (dueBefore) args.dueBefore = dueBefore;
      return args;
    }
    case 'createTask': {
      const args = { title: text(input.title, 'title', { required: true, max: 300 }), priority: input.priority || 'media' };
      if (!PRIORITIES.includes(args.priority)) throw new Error('Prioridade inválida.');
      for (const key of ['subjectName', 'description']) { const value = text(input[key], key, { max: key === 'description' ? 2000 : 160 }); if (value) args[key] = value; }
      const dueDate = isoDate(input.dueDate, 'dueDate'); if (dueDate) args.dueDate = dueDate;
      return args;
    }
    case 'updateTask': {
      const taskId = text(input.taskId, 'taskId', { required: true }); if (!UUID.test(taskId)) throw new Error('taskId inválido.');
      const args = { taskId };
      if (input.status !== undefined) { if (!STATUSES.includes(input.status)) throw new Error('Status inválido.'); args.status = input.status; }
      if (input.priority !== undefined) { if (!PRIORITIES.includes(input.priority)) throw new Error('Prioridade inválida.'); args.priority = input.priority; }
      for (const key of ['title', 'description']) { const value = text(input[key], key, { max: key === 'title' ? 300 : 2000 }); if (value) args[key] = value; }
      const dueDate = isoDate(input.dueDate, 'dueDate'); if (dueDate) args.dueDate = dueDate;
      if (Object.keys(args).length === 1) throw new Error('Informe pelo menos um campo para alterar.');
      return args;
    }
    case 'deleteTask': { const taskId = text(input.taskId, 'taskId', { required: true }); if (!UUID.test(taskId)) throw new Error('taskId inválido.'); return { taskId }; }
    case 'listSubjects':
    case 'getAcademicOverview': return {};
    case 'suggestStudyPlan': {
      const hours = Number(input.availableHours); if (!Number.isFinite(hours) || hours <= 0 || hours > 80) throw new Error('availableHours deve estar entre 0 e 80.');
      const args = { availableHours: hours };
      for (const key of ['subjectName', 'topic']) { const value = text(input[key], key, { max: 160 }); if (value) args[key] = value; }
      return args;
    }
    case 'calculateRequiredGrade': {
      const subjectId = text(input.subjectId, 'subjectId', { required: true }); if (!UUID.test(subjectId)) throw new Error('subjectId inválido.');
      const targetAverage = input.targetAverage === undefined ? 7 : Number(input.targetAverage); if (!Number.isFinite(targetAverage) || targetAverage < 0 || targetAverage > 10) throw new Error('targetAverage deve estar entre 0 e 10.');
      return { subjectId, targetAverage };
    }
    default: throw new Error('Ferramenta não permitida.');
  }
}

const unwrap = (result) => { if (result.error) throw new Error(result.error.message); return result.data; };

async function resolveSubject(db, name) {
  if (!name) return null;
  const data = unwrap(await db.from('subjects').select('id,name').ilike('name', name).limit(1).maybeSingle());
  if (!data) throw new Error(`A disciplina "${name}" não está cadastrada. Solicite esclarecimento ao estudante.`);
  return data;
}

export async function executeReadTool(db, name, args) {
  if (name === 'listTasks') {
    const subject = args.subjectName ? await resolveSubject(db, args.subjectName) : null;
    let query = db.from('tasks').select('id,title,description,status,priority,due_date,subjects(name)').order('due_date', { ascending: true, nullsFirst: false }).limit(50);
    if (args.status && args.status !== 'overdue') query = query.eq('status', args.status);
    if (args.status === 'overdue') query = query.neq('status', 'completed').lt('due_date', new Date().toISOString());
    if (args.priority) query = query.eq('priority', args.priority);
    if (args.dueBefore) query = query.lte('due_date', args.dueBefore);
    if (subject) query = query.eq('subject_id', subject.id);
    return { tasks: unwrap(await query) };
  }
  if (name === 'listSubjects') return { subjects: unwrap(await db.from('subjects').select('id,code,name,credits,current_grade,total_classes,max_absences').order('name')) };
  if (name === 'calculateRequiredGrade') {
    const subject = unwrap(await db.from('subjects').select('id,name,assessments(id,name,weight,grade,status)').eq('id', args.subjectId).maybeSingle());
    if (!subject) throw new Error('Disciplina não encontrada.');
    return { subject: subject.name, targetAverage: args.targetAverage, calculation: calculateSimulatorGrade({ assessments: subject.assessments, targetAverage: args.targetAverage }) };
  }
  if (name === 'suggestStudyPlan') {
    const subject = args.subjectName ? await resolveSubject(db, args.subjectName) : null;
    let query = db.from('tasks').select('id,title,status,priority,due_date,estimated_time,subjects(name)').neq('status', 'completed').order('due_date', { ascending: true, nullsFirst: false }).limit(30);
    if (subject) query = query.eq('subject_id', subject.id);
    return { availableHours: args.availableHours, topic: args.topic || null, subject, openTasks: unwrap(await query) };
  }
  if (name === 'getAcademicOverview') {
    const [tasks, subjects] = await Promise.all([db.from('tasks').select('id,status,priority,due_date'), db.from('subjects').select('id,name,current_grade,credits,attendance_records(status)')]);
    const taskRows = unwrap(tasks); const subjectRows = unwrap(subjects); const now = Date.now();
    return { tasks: { total: taskRows.length, pending: taskRows.filter((t) => t.status === 'pending').length, overdue: taskRows.filter((t) => t.status !== 'completed' && t.due_date && new Date(t.due_date).getTime() < now).length }, subjects: subjectRows.map((subject) => ({ id: subject.id, name: subject.name, currentGrade: subject.current_grade, credits: subject.credits, attendance: { present: subject.attendance_records.filter((item) => item.status === 'present').length, absent: subject.attendance_records.filter((item) => item.status === 'absent').length } })) };
  }
  throw new Error('Ferramenta de leitura não permitida.');
}

export async function normalizeMutation(db, name, args) {
  if (name === 'createTask') { const subject = await resolveSubject(db, args.subjectName); return { ...args, subjectId: subject?.id || null, subjectName: subject?.name || null }; }
  const task = unwrap(await db.from('tasks').select('id,title,status,priority,due_date').eq('id', args.taskId).maybeSingle());
  if (!task) throw new Error('Tarefa não encontrada ou não autorizada.');
  return { ...args, currentTask: task };
}

export async function executeMutation(db, name, args) {
  if (name === 'createTask') {
    const row = { title: args.title, description: args.description || '', priority: args.priority, due_date: args.dueDate || null, subject_id: args.subjectId || null, status: 'pending', is_ai_prioritized: true, has_ai_badge: true, ai_badge_text: 'Criada pelo agente' };
    return { task: unwrap(await db.from('tasks').insert(row).select('id,title,status,priority,due_date,subject_id').single()) };
  }
  if (name === 'updateTask') {
    const row = {}; for (const [source, target] of [['title','title'],['description','description'],['priority','priority'],['status','status'],['dueDate','due_date']]) if (args[source] !== undefined) row[target] = args[source];
    return { task: unwrap(await db.from('tasks').update(row).eq('id', args.taskId).select('id,title,status,priority,due_date,subject_id').single()) };
  }
  if (name === 'deleteTask') { const task = unwrap(await db.from('tasks').delete().eq('id', args.taskId).select('id,title').single()); return { deletedTask: task }; }
  throw new Error('Ferramenta de alteração não permitida.');
}
