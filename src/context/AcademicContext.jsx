/**
 * @file AcademicContext.jsx
 * Centralized State Management for TaskMind — Academic Intelligence.
 * Synchronizes Tasks, Subjects, Attendance, Deadlines, Chat History and AI Planner across all screens.
 * Persists data to localStorage with automatic reactivity.
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  STORAGE_KEYS,
  INITIAL_TASKS,
  INITIAL_SUBJECTS,
  INITIAL_CHAT,
  INITIAL_ACTION_PLAN,
  INITIAL_SETTINGS,
  loadFromStorage,
  saveToStorage,
} from '../services/storageService.js';
import { confirmAgentOperation, processAgentMessage } from '../services/agentService.js';
import {
  validateProposalExecution,
  prepareTaskFromProposal,
  markProposalExecuted,
} from '../services/agentExecutionService.js';
import { calculateOverallAttendance, calculateIra } from '../utils/academicCalculations.js';
import { isSupabaseConfigured } from '../services/supabaseClient.js';
import { loadAcademicData, persistTask, removeTask, persistSubject, removeSubject, setTodayAttendance, persistStudyPlan } from '../services/academicRepository.js';
import { useAuth } from './AuthContext.jsx';

const AcademicContext = createContext(null);

export function AcademicProvider({ children }) {
  const { user } = useAuth();
  const [repositoryError, setRepositoryError] = useState('');
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [conversationId, setConversationId] = useState(null);
  // 1. Centralized Persistent States
  const [tasks, setTasks] = useState(() => isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS));
  const [subjects, setSubjects] = useState(() => isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS));
  const [chatMessages, setChatMessages] = useState(() =>
    isSupabaseConfigured ? [] : loadFromStorage(STORAGE_KEYS.CHAT_MESSAGES, INITIAL_CHAT)
  );
  const [actionPlan, setActionPlan] = useState(() =>
    isSupabaseConfigured ? { title: 'Nenhum plano salvo', description: 'Peça ao agente um plano de estudos baseado nas suas tarefas.', stats: { totalTime: '0h', efficiency: '—' }, steps: [] } : loadFromStorage(STORAGE_KEYS.AI_ACTION_PLAN, INITIAL_ACTION_PLAN)
  );
  const [settings, setSettings] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !user) { setIsLoading(false); return; }
    setSettings((old) => ({ ...old, user: { ...old.user, name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Estudante', course: '', institution: '', semester: '', avatar: user.user_metadata?.avatar_url || '' } }));
    setIsLoading(true);
    loadAcademicData().then((data) => {
      setTasks(data.tasks); setSubjects(data.subjects);
      setConversationId(data.conversation?.id || null);
      setChatMessages((data.conversation?.chat_messages || []).map((m) => ({ id: m.id, sender: m.role === 'user' ? 'user' : 'assistant', content: m.content, timestamp: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), toolProposal: m.metadata?.toolProposal })));
      const semesterEnd = data.academicSettings?.semester_end ? new Date(`${data.academicSettings.semester_end}T23:59:59`) : null;
      const semesterStart = data.academicSettings?.semester_start ? new Date(`${data.academicSettings.semester_start}T00:00:00`) : null;
      const daysRemaining = semesterEnd ? Math.max(0, Math.ceil((semesterEnd - new Date()) / 86400000)) : 0;
      const progress = semesterStart && semesterEnd && semesterEnd > semesterStart ? Math.max(0, Math.min(100, Math.round(((Date.now() - semesterStart.getTime()) / (semesterEnd - semesterStart)) * 100))) : 0;
      setSettings((old) => ({ ...old, user: { ...old.user, name: data.profile?.full_name || user.email?.split('@')[0] || 'Estudante', course: data.profile?.course || '', institution: data.profile?.institution || '', semester: data.profile?.semester || '', daysRemaining, semesterProgressPercent: progress } }));
      if (data.plan?.plan) setActionPlan(data.plan.plan);
    }).catch((error) => setRepositoryError(error.message)).finally(() => setIsLoading(false));
  }, [user]);

  // Sync to localStorage whenever states change
  useEffect(() => {
    if (!isSupabaseConfigured) saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    if (!isSupabaseConfigured) saveToStorage(STORAGE_KEYS.SUBJECTS, subjects);
  }, [subjects]);

  useEffect(() => {
    if (!isSupabaseConfigured) saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.AI_ACTION_PLAN, actionPlan);
  }, [actionPlan]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Global Modal trigger state for "Nova Tarefa" and "Simulador"
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isSimulatorModalOpen, setIsSimulatorModalOpen] = useState(false);
  const [selectedSimulatorSubjectId, setSelectedSimulatorSubjectId] = useState('subj-1');

  // Search query (global header search bar)
  const [globalSearch, setGlobalSearch] = useState('');

  // 2. Computed Real Indicators
  const metrics = useMemo(() => {
    const now = new Date();

    const pending = tasks.filter((t) => t.status === 'pending');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const completed = tasks.filter((t) => t.status === 'completed');

    // Overdue check: past due date, not completed, and has a defined dueDate
    const overdue = tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      return !isNaN(due.getTime()) && due < now;
    });

    // Today's priorities (must have a defined dueDate matching today)
    const today = tasks.filter((t) => {
      if (t.status === 'completed' || !t.dueDate) return false;
      const due = new Date(t.dueDate);
      if (isNaN(due.getTime())) return false;
      return (
        due.getDate() === now.getDate() &&
        due.getMonth() === now.getMonth() &&
        due.getFullYear() === now.getFullYear()
      );
    });

    // Fallback: If no tasks fall exactly on current calendar day, take pending high-priority tasks
    const activePriorities = today.length > 0 ? today : pending.slice(0, 4);

    // Upcoming deadlines sorted by date (tasks with defined dueDate only)
    const sortedUpcoming = [...tasks]
      .filter((t) => t.status !== 'completed' && t.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Attendance calculation from actual records using production calculation module
    const overallAttendanceRate = calculateOverallAttendance(subjects);

    // IRA calculation (weighted by credits) using production calculation module
    const calculatedIra = calculateIra(subjects);

    return {
      pendingCount: pending.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      overdueCount: overdue.length,
      totalCount: tasks.length,
      activePriorities,
      sortedUpcoming,
      overallAttendanceRate,
      calculatedIra,
    };
  }, [tasks, subjects]);

  // 3. Task Actions
  const createTask = (taskData) => {
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskData.title.trim(),
      subjectId: taskData.subjectId || (subjects[0] ? subjects[0].id : ''),
      subjectName:
        taskData.subjectName ||
        (subjects.find((s) => s.id === taskData.subjectId)?.name || 'Geral'),
      dueDate: taskData.dueDate || null,
      priority: taskData.priority || 'media',
      status: taskData.status || 'pending',
      estimatedTime: taskData.estimatedTime || '1h 00m',
      description: taskData.description || '',
      isAiPrioritized: Boolean(taskData.isAiPrioritized),
      hasAiBadge: Boolean(taskData.hasAiBadge),
      aiBadgeText: taskData.aiBadgeText || '',
      subtasks: taskData.subtasks || [],
      isDemo: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    if (isSupabaseConfigured) persistTask(newTask).then((saved) => setTasks((prev) => prev.map((t) => t.id === newTask.id ? { ...t, id: saved.id } : t))).catch((error) => { setTasks((prev) => prev.filter((t) => t.id !== newTask.id)); setRepositoryError(error.message); });
    return newTask;
  };

  const updateTask = (taskId, fields) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...fields } : t))
    );
    if (isSupabaseConfigured) { const current = tasks.find((t) => t.id === taskId); if (current) persistTask({ ...current, ...fields }).catch((error) => setRepositoryError(error.message)); }
  };

  const deleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (isSupabaseConfigured) removeTask(taskId).catch((error) => setRepositoryError(error.message));
  };

  const toggleTaskStatus = (taskId) => {
    const current = tasks.find((task) => task.id === taskId);
    if (current && isSupabaseConfigured) persistTask({ ...current, status: current.status === 'completed' ? 'pending' : 'completed' }).catch((error) => setRepositoryError(error.message));
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const toggleSubtask = (taskId, subtaskId) => {
    const current = tasks.find((task) => task.id === taskId);
    if (current && isSupabaseConfigured) persistTask({ ...current, subtasks: current.subtasks.map((item) => item.id === subtaskId ? { ...item, completed: !item.completed } : item) }).catch((error) => setRepositoryError(error.message));
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubs = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: updatedSubs };
        }
        return t;
      })
    );
  };

  // 4. Subject Actions
  const createSubject = (subjectData) => {
    const newSubj = {
      id: `subj-${Date.now()}`,
      code: subjectData.code || 'CC000',
      name: subjectData.name.trim(),
      professor: subjectData.professor || 'Docente Responsável',
      credits: Number(subjectData.credits) || 4,
      workload: Number(subjectData.workload) || 60,
      room: subjectData.room || 'Campus Central',
      color: subjectData.color || '#7C3AED',
      category: subjectData.category || 'Exatas & Comp',
      totalClasses: Number(subjectData.totalClasses) || 0,
      attendances: Number(subjectData.attendances) || 0,
      absences: Number(subjectData.absences) || 0,
      maxAbsences: Number(subjectData.maxAbsences) || 0,
      currentGrade:
        subjectData.currentGrade !== undefined &&
        subjectData.currentGrade !== null &&
        subjectData.currentGrade !== '' &&
        !isNaN(Number(subjectData.currentGrade))
          ? Number(subjectData.currentGrade)
          : null,
      assessments: subjectData.assessments || [],
      syllabus: subjectData.syllabus || ['Conteúdo em estruturação...'],
      aiInsight: 'Disciplina cadastrada pelo usuário no TaskMind.',
      isDemo: false,
    };
    setSubjects((prev) => [...prev, newSubj]);
    if (isSupabaseConfigured) persistSubject(newSubj).then((saved) => setSubjects((prev) => prev.map((s) => s.id === newSubj.id ? { ...s, id: saved.id } : s))).catch((error) => setRepositoryError(error.message));
    return newSubj;
  };

  const updateSubject = (subjectId, fields) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, ...fields } : s))
    );
    if (isSupabaseConfigured) { const current = subjects.find((s) => s.id === subjectId); if (current) persistSubject({ ...current, ...fields }).catch((error) => setRepositoryError(error.message)); }
  };

  const deleteSubject = (subjectId) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
    if (isSupabaseConfigured) removeSubject(subjectId).catch((error) => setRepositoryError(error.message));
  };

  const addAbsence = async (subjectId) => {
    if (isSupabaseConfigured) {
      try { await setTodayAttendance(subjectId, 'absent'); const data = await loadAcademicData(); setSubjects(data.subjects); } catch (error) { setRepositoryError(error.message); }
      return;
    }
    if (isSupabaseConfigured) setTodayAttendance(subjectId, 'absent').catch((error) => setRepositoryError(error.message));
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id === subjectId) {
          const absences = s.absences + 1;
          const attendances = Math.max(0, s.attendances - 1);
          return { ...s, absences, attendances };
        }
        return s;
      })
    );
  };

  const addAttendance = async (subjectId) => {
    if (isSupabaseConfigured) {
      try { await setTodayAttendance(subjectId, 'present'); const data = await loadAcademicData(); setSubjects(data.subjects); } catch (error) { setRepositoryError(error.message); }
      return;
    }
    if (isSupabaseConfigured) setTodayAttendance(subjectId, 'present').catch((error) => setRepositoryError(error.message));
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id === subjectId && s.absences > 0) {
          return {
            ...s,
            absences: s.absences - 1,
            attendances: s.attendances + 1,
          };
        }
        return s;
      })
    );
  };

  // 5. Chat & Agent Actions
  const sendUserMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      authorName: settings.user.name,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      content: text,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    // Process through agent architecture
    let response;
    try {
      response = await processAgentMessage(text, { tasks, subjects, conversationId });
      if (response.conversationId) setConversationId(response.conversationId);
      if (response.studyPlan) setActionPlan(response.studyPlan);
    } catch (error) {
      response = { content: `Não foi possível processar sua mensagem: ${error.message}`, notice: 'Nenhuma operação foi executada.' };
      setRepositoryError(error.message);
    }

    setTimeout(() => {
      const assistantMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        authorName: 'TaskMind AI',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        badge: 'Cross-Schedule v2',
        content: response.content,
        toolProposal: response.toolProposal,
        contextFactors: response.contextFactors || [],
        notice: response.notice,
      };
      setChatMessages((prev) => [...prev, assistantMsg]);
    }, 450);
  };

  const executeProposedAction = async (proposal, messageId) => {
    if (isSupabaseConfigured) {
      if (proposal?.executed) return { success: false, error: 'Esta ação já foi executada.' };
      setChatMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, toolProposal: { ...msg.toolProposal, confirming: true } } : msg));
      try {
        const result = await confirmAgentOperation(proposal.id);
        const data = await loadAcademicData();
        setTasks(data.tasks); setSubjects(data.subjects);
        setChatMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, toolProposal: { ...msg.toolProposal, executed: true, executedAt: new Date().toISOString() } } : msg).concat({ id: `msg-${Date.now()}`, sender: 'assistant', authorName: 'TaskMind AI', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), content: result.content }));
        return { success: true, result: result.result };
      } catch (error) {
        setRepositoryError(error.message);
        setChatMessages((prev) => prev.map((msg) => msg.id === messageId ? { ...msg, toolProposal: { ...msg.toolProposal, confirming: false } } : msg).concat({ id: `msg-${Date.now()}`, sender: 'assistant', authorName: 'TaskMind AI', timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), content: `A operação não foi executada: ${error.message}` }));
        return { success: false, error: error.message };
      }
    }
    // 1. Validate proposal execution via production guards module
    const validation = validateProposalExecution({
      proposal,
      existingTasks: tasks,
    });

    if (!validation.valid) {
      if (validation.unsupported) {
        const errorMsg = {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          authorName: 'TaskMind AI',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          content: `⚠️ A operação "${proposal?.name || 'desconhecida'}" não é suportada na Fase 1 (ferramenta aguardando integração com Gemini API na Fase 2).`,
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      } else if (validation.isDuplicate) {
        const dupNotice = {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          authorName: 'TaskMind AI',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          content: `ℹ️ A tarefa "${proposal.params?.title || ''}" já está cadastrada na sua lista. Criação duplicada evitada.`,
        };
        setChatMessages((prev) => [...prev, dupNotice]);
      }
      return { success: false, error: validation.error };
    }

    // 2. Mark proposal as executed in chatMessages state
    setChatMessages((prev) =>
      prev.map((msg) => {
        const isTarget =
          (messageId && msg.id === messageId) ||
          (msg.toolProposal && (msg.toolProposal.id === proposal.id || msg.toolProposal === proposal));

        if (isTarget && msg.toolProposal) {
          return {
            ...msg,
            toolProposal: {
              ...msg.toolProposal,
              executed: true,
              executedAt: new Date().toISOString(),
            },
          };
        }
        return msg;
      })
    );

    // Mutate local proposal object so caller references know it was executed
    markProposalExecuted(proposal);

    // 3. Handle createTask safely with production task preparation
    if (proposal.name === 'createTask') {
      const taskPayload = prepareTaskFromProposal(proposal, subjects);
      const created = createTask(taskPayload);

      // Append confirmation to chat
      const confirmMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        authorName: 'TaskMind AI',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        content: `✅ Operação executada com sucesso! A tarefa "${created.title}" foi adicionada à sua grade de Minhas Tarefas${
          created.dueDate ? ' e sincronizada com o Calendário' : ' (sem prazo definido)'
        }.`,
      };
      setChatMessages((prev) => [...prev, confirmMsg]);
      return { success: true, created };
    }

    // 4. Handle suggestStudyPlan safely
    if (proposal.name === 'suggestStudyPlan') {
      const params = proposal.params || {};
      setActionPlan((prev) => ({
        ...prev,
        title: `Plano Reestruturado: ${params.topic || 'Foco Acadêmico'}`,
        description: `Otimizado para carga horária de ${params.availableHours || 3} horas com intervalos de alta retenção.`,
      }));

      const confirmMsg = {
        id: `msg-${Date.now()}`,
        sender: 'assistant',
        authorName: 'TaskMind AI',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        content: `🎯 Cronograma atualizado no painel lateral! Suas sessões de estudo foram reorganizadas para evitar sobrecarga.`,
      };
      setChatMessages((prev) => [...prev, confirmMsg]);
      return { success: true };
    }

    return { success: false, error: 'Ação não processada.' };
  };

  const clearChat = () => {
    setChatMessages([]);
    setConversationId(null);
  };

  const toggleActionPlanStep = (stepId) => {
    setActionPlan((prev) => ({
      ...prev,
      steps: prev.steps.map((st) =>
        st.id === stepId ? { ...st, completed: !st.completed } : st
      ),
    }));
  };

  const saveActionPlan = async () => {
    if (!isSupabaseConfigured) { saveToStorage(STORAGE_KEYS.AI_ACTION_PLAN, actionPlan); return { success: true }; }
    try { await persistStudyPlan(actionPlan); return { success: true }; } catch (error) { setRepositoryError(error.message); return { success: false, error: error.message }; }
  };

  const value = {
    tasks,
    subjects,
    chatMessages,
    actionPlan,
    settings,
    metrics,
    isLoading,
    repositoryError,
    conversationId,
    globalSearch,
    setGlobalSearch,

    // Modal controllers
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    isSimulatorModalOpen,
    setIsSimulatorModalOpen,
    selectedSimulatorSubjectId,
    setSelectedSimulatorSubjectId,

    // Operations
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubtask,

    createSubject,
    updateSubject,
    deleteSubject,
    addAbsence,
    addAttendance,

    sendUserMessage,
    executeProposedAction,
    clearChat,
    toggleActionPlanStep,
    saveActionPlan,
  };

  return <AcademicContext.Provider value={value}>{children}</AcademicContext.Provider>;
}

export function useAcademic() {
  const context = useContext(AcademicContext);
  if (!context) {
    throw new Error('useAcademic must be used within an AcademicProvider');
  }
  return context;
}
