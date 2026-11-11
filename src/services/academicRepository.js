import { supabase } from './supabaseClient.js';

const required = () => {
  if (!supabase) throw new Error('Supabase não foi configurado. Confira as variáveis VITE_SUPABASE_*.');
  return supabase;
};
const fail = (error) => { if (error) throw error; };

export async function loadAcademicData() {
  const db = required();
  const [tasks, subjects, conversations, plans, profile, academicSettings, operations] = await Promise.all([
    db.from('tasks').select('*, subjects(name), subtasks(*)').order('created_at', { ascending: false }),
    db.from('subjects').select('*, assessments(*), attendance_records(*)').order('created_at'),
    db.from('chat_conversations').select('*, chat_messages(*)').order('updated_at', { ascending: false }).limit(1),
    db.from('study_plans').select('*').order('updated_at', { ascending: false }).limit(1),
    db.from('profiles').select('*').maybeSingle(),
    db.from('academic_settings').select('*').maybeSingle(),
    db.from('agent_operations').select('id,status,executed_at').order('created_at', { ascending: false }).limit(30),
  ]);
  [tasks, subjects, conversations, plans, profile, academicSettings, operations].forEach(({ error }) => fail(error));
  return {
    tasks: tasks.data.map((t) => ({ ...t, subjectId: t.subject_id, subjectName: t.subjects?.name || 'Geral', dueDate: t.due_date, estimatedTime: t.estimated_time, isAiPrioritized: t.is_ai_prioritized, hasAiBadge: t.has_ai_badge, aiBadgeText: t.ai_badge_text, subtasks: t.subtasks || [] })),
    subjects: subjects.data.map((s) => ({ ...s, totalClasses: s.total_classes, attendances: s.attendance_records.filter((a) => a.status === 'present').length, absences: s.attendance_records.filter((a) => a.status === 'absent').length, maxAbsences: s.max_absences, currentGrade: s.current_grade, assessments: s.assessments || [] })),
    conversation: conversations.data[0] ? { ...conversations.data[0], chat_messages: [...(conversations.data[0].chat_messages || [])].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) } : null,
    plan: plans.data[0] || null,
    profile: profile.data || null,
    academicSettings: academicSettings.data || null,
    operations: operations.data || [],
  };
}

export async function syncProfileMetadata(userId, metadata = {}) {
  const db = required();
  const patch = {};
  if (metadata.full_name) patch.full_name = metadata.full_name;
  if (metadata.course) patch.course = metadata.course;
  if (metadata.institution) patch.institution = metadata.institution;
  if (metadata.semester) patch.semester = metadata.semester;
  if (Object.keys(patch).length === 0) return null;
  const r = await db.from('profiles').upsert({ id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'id' }).select().single();
  fail(r.error);
  return r.data;
}

export async function persistTask(task) {
  const db = required();
  const row = { title: task.title, subject_id: task.subjectId || null, due_date: task.dueDate || null, priority: task.priority, status: task.status, estimated_time: task.estimatedTime, description: task.description, is_ai_prioritized: !!task.isAiPrioritized, has_ai_badge: !!task.hasAiBadge, ai_badge_text: task.aiBadgeText || null };
  const result = task.id && !String(task.id).startsWith('task-') ? await db.from('tasks').update(row).eq('id', task.id).select().single() : await db.from('tasks').insert(row).select().single();
  fail(result.error);
  if (Array.isArray(task.subtasks)) {
    const removed = await db.from('subtasks').delete().eq('task_id', result.data.id); fail(removed.error);
    if (task.subtasks.length) {
      const inserted = await db.from('subtasks').insert(task.subtasks.map((item, position) => ({ task_id: result.data.id, text: item.text, completed: !!item.completed, position }))); fail(inserted.error);
    }
  }
  return result.data;
}
export async function removeTask(id) { const r = await required().from('tasks').delete().eq('id', id); fail(r.error); }
export async function persistSubject(subject) {
  const row = { code: subject.code, name: subject.name, professor: subject.professor, credits: subject.credits, workload: subject.workload, room: subject.room, color: subject.color, category: subject.category, total_classes: subject.totalClasses, max_absences: subject.maxAbsences, current_grade: subject.currentGrade, syllabus: subject.syllabus, ai_insight: subject.aiInsight };
  const db = required();
  const r = subject.id && !String(subject.id).startsWith('subj-') ? await db.from('subjects').update(row).eq('id', subject.id).select().single() : await db.from('subjects').insert(row).select().single(); fail(r.error);
  if (Array.isArray(subject.assessments)) {
    const removed = await db.from('assessments').delete().eq('subject_id', r.data.id); fail(removed.error);
    if (subject.assessments.length) {
      const inserted = await db.from('assessments').insert(subject.assessments.map((item) => ({ subject_id: r.data.id, name: item.name, weight: item.weight, grade: item.grade ?? null, assessment_date: item.date || null, status: item.status || 'pending' }))); fail(inserted.error);
    }
  }
  return r.data;
}
export async function removeSubject(id) { const r = await required().from('subjects').delete().eq('id', id); fail(r.error); }
export async function setTodayAttendance(subjectId, status) { const r = await required().from('attendance_records').upsert({ subject_id: subjectId, class_date: new Date().toISOString().slice(0, 10), status }, { onConflict: 'subject_id,class_date' }); fail(r.error); }
export async function persistStudyPlan(plan) { const r = await required().from('study_plans').insert({ title: plan.title, description: plan.description || '', plan }).select().single(); fail(r.error); return r.data; }
export async function saveChatMessage(message, conversationId) {
  const db = required();
  let id = conversationId;
  if (!id) { const c = await db.from('chat_conversations').insert({ title: 'Conversa acadêmica' }).select().single(); fail(c.error); id = c.data.id; }
  const r = await db.from('chat_messages').insert({ conversation_id: id, role: message.sender === 'user' ? 'user' : 'assistant', content: message.content, metadata: { toolProposal: message.toolProposal || null } }); fail(r.error); return id;
}
