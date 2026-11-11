/**
 * @file TasksPage.jsx
 * Screen 2: Minhas Tarefas e Gestão Acadêmica.
 * Full CRUD operations, Table/Kanban/List view switches, search & filters,
 * real date-based overdue calculation, and deletion confirmation modal.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext.jsx';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal.jsx';

export default function TasksPage() {
  const {
    tasks,
    subjects,
    metrics,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setIsTaskModalOpen,
    setEditingTask,
    globalSearch,
  } = useAcademic();

  const navigate = useNavigate();

  // Local filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, pending, in_progress, completed, overdue
  const [viewMode, setViewMode] = useState('table'); // table, kanban, list
  const [sortBy, setSortBy] = useState('dueDate'); // dueDate, priority, title

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Combine local search and global search
  const effectiveSearch = (searchQuery || globalSearch || '').toLowerCase().trim();

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    const now = new Date();

    return tasks.filter((task) => {
      // Search query
      if (effectiveSearch) {
        const matchesTitle = task.title.toLowerCase().includes(effectiveSearch);
        const matchesSubject = task.subjectName.toLowerCase().includes(effectiveSearch);
        const matchesDesc = (task.description || '').toLowerCase().includes(effectiveSearch);
        if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
      }

      // Discipline filter
      if (selectedDiscipline && task.subjectId !== selectedDiscipline) {
        return false;
      }

      // Priority filter
      if (selectedPriority && task.priority !== selectedPriority) {
        return false;
      }

      // Status filter
      if (statusFilter === 'pending' && task.status !== 'pending') return false;
      if (statusFilter === 'in_progress' && task.status !== 'in_progress') return false;
      if (statusFilter === 'completed' && task.status !== 'completed') return false;
      if (statusFilter === 'overdue') {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        const isOverdue = task.status !== 'completed' && !isNaN(due.getTime()) && due < now;
        if (!isOverdue) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'priority') {
        const pOrder = { urgente: 1, alta: 2, media: 3, baixa: 4 };
        return (pOrder[a.priority] || 5) - (pOrder[b.priority] || 5);
      }
      return a.title.localeCompare(b.title);
    });
  }, [tasks, effectiveSearch, selectedDiscipline, selectedPriority, statusFilter, sortBy]);

  const handleEdit = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handlePromptDelete = (task) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 left-12 w-80 h-80 bg-surface-container-highest/60 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="w-full max-w-[1520px] mx-auto px-margin-mobile lg:px-gutter py-space-lg flex flex-col gap-space-xl">
        {/* Header Stage & Metric Snippets */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-xs">
              <span className="px-2 py-0.5 rounded-full font-code-sm text-code-sm bg-surface-container-high text-on-surface-variant font-medium tracking-wide">
                SEMESTRE 2026.2 • SEMANA 16
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              <span className="font-code-sm text-code-sm text-secondary font-semibold">
                Sincronizado via SIGAA [Demonstração da Fase 1]
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm flex-wrap">
              <h1 className="font-display text-display text-on-surface tracking-tight">
                Minhas Tarefas Acadêmicas
              </h1>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {tasks.length} tarefas catalogadas ({metrics.pendingCount} pendentes)
              </span>
            </div>
          </div>

          {/* Quick Action Controls: View Switcher + Nova Tarefa */}
          <div className="flex items-center gap-space-sm flex-wrap">
            {/* View Switcher */}
            <div className="flex items-center p-1 bg-surface-container-low rounded-xl shadow-xs border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">table_rows</span>
                <span>Tabela</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">view_kanban</span>
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-lg">view_agenda</span>
                <span>Lista</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-space-xs h-10 px-4 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md shadow-md hover:bg-secondary-container transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add_task</span>
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar Panel */}
        <div className="flex flex-col gap-space-md p-space-md bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-space-sm justify-between">
            {/* Search Field */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, disciplina, etiqueta ou docente..."
                className="w-full h-11 pl-11 pr-12 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/40 transition-all border border-transparent focus:border-secondary"
              />
              <kbd className="hidden md:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 font-code-sm text-code-sm text-on-surface-variant bg-surface-container rounded">
                Ctrl+F
              </kbd>
            </div>

            {/* Dropdown Selectors */}
            <div className="flex items-center gap-space-xs overflow-x-auto pb-1 lg:pb-0">
              {/* Disciplina Selector */}
              <div className="relative min-w-[210px]">
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-9 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
                >
                  <option value="">Todas as Disciplinas ({subjects.length})</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
                  expand_more
                </span>
              </div>

              {/* Prioridade Selector */}
              <div className="relative min-w-[160px]">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full h-11 pl-3.5 pr-9 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-xl appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-secondary/40 border border-transparent"
                >
                  <option value="">Prioridade: Geral</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
                  tune
                </span>
              </div>

              {/* Quick Sort Toggle */}
              <button
                type="button"
                onClick={() => setSortBy(sortBy === 'dueDate' ? 'priority' : 'dueDate')}
                className="h-11 px-3.5 bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface rounded-xl flex items-center gap-1 font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">swap_vert</span>
                <span>{sortBy === 'dueDate' ? 'Prazo Próximo' : 'Por Prioridade'}</span>
              </button>
            </div>
          </div>

          {/* Quick Status Pills Strip */}
          <div className="flex items-center gap-space-xs overflow-x-auto pt-space-xs scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              Todas <span className="ml-1 opacity-70">{tasks.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              Pendentes{' '}
              <span className="ml-1 px-1.5 py-0.5 bg-surface-container rounded-full font-code-sm text-code-sm">
                {metrics.pendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'in_progress'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              Em Andamento{' '}
              <span className="ml-1 px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-semibold rounded-full font-code-sm text-code-sm">
                {metrics.inProgressCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
              }`}
            >
              Concluídas{' '}
              <span className="ml-1 px-1.5 py-0.5 bg-surface-container rounded-full font-code-sm text-code-sm">
                {metrics.completedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('overdue')}
              className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === 'overdue'
                  ? 'bg-error text-on-error font-bold shadow-xs'
                  : 'bg-error-container text-on-error-container font-semibold'
              }`}
            >
              Atrasadas{' '}
              <span className="ml-1 px-1.5 py-0.5 bg-error text-on-error rounded-full font-code-sm text-code-sm font-bold">
                {metrics.overdueCount}
              </span>
            </button>
          </div>
        </div>

        {/* View Switch: Table / Kanban / List */}
        {viewMode === 'table' && (
          <div className="bg-surface-container-lowest rounded-2xl shadow-xs overflow-hidden flex flex-col border border-outline-variant/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                    <th className="py-3.5 pl-6 pr-3 w-12 text-center" scope="col">
                      <span className="sr-only">Status</span>
                    </th>
                    <th className="py-3.5 px-4 font-semibold" scope="col">
                      Tarefa / Atividade
                    </th>
                    <th className="py-3.5 px-4 font-semibold" scope="col">
                      Disciplina
                    </th>
                    <th className="py-3.5 px-4 font-semibold" scope="col">
                      Prazo de Entrega
                    </th>
                    <th className="py-3.5 px-4 font-semibold" scope="col">
                      Prioridade
                    </th>
                    <th className="py-3.5 px-4 font-semibold" scope="col">
                      Status
                    </th>
                    <th className="py-3.5 pr-6 pl-4 font-semibold text-right" scope="col">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-surface-container-low font-body-md text-body-md text-on-surface">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-on-surface-variant font-body-md">
                        Nenhuma tarefa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const isOverdue =
                        !isCompleted &&
                        Boolean(task.dueDate) &&
                        !isNaN(new Date(task.dueDate).getTime()) &&
                        new Date(task.dueDate) < new Date();

                      return (
                        <tr
                          key={task.id}
                          className={`hover:bg-surface-container-low/70 transition-colors group ${
                            task.status === 'in_progress' ? 'bg-secondary-fixed/10' : ''
                          }`}
                        >
                          {/* Checkbox column */}
                          <td className="py-4 pl-6 pr-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => toggleTaskStatus(task.id)}
                              aria-label={`Concluir ${task.title}`}
                              className="w-4 h-4 rounded text-secondary focus:ring-secondary/40 cursor-pointer accent-secondary"
                            />
                          </td>

                          {/* Task details */}
                          <td className="py-4 px-4 align-middle">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  onClick={() => handleEdit(task)}
                                  className={`font-title text-title font-semibold text-on-surface group-hover:text-secondary transition-colors cursor-pointer ${
                                    isCompleted ? 'line-through opacity-50' : ''
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.isDemo && (
                                  <span className="px-1.5 py-0.5 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant font-medium">
                                    Demonstração
                                  </span>
                                )}
                                {task.hasAiBadge && (
                                  <span className="px-2 py-0.5 rounded font-code-sm text-code-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                                    {task.aiBadgeText || 'IA Sugestão'}
                                  </span>
                                )}
                              </div>
                              {task.description && (
                                <span className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                                  {task.description}
                                </span>
                              )}
                              {task.subtasks && task.subtasks.length > 0 && (
                                <span className="font-code-sm text-code-sm text-secondary font-medium mt-0.5">
                                  Checklist: {task.subtasks.filter((s) => s.completed).length}/
                                  {task.subtasks.length} concluídas
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Subject chip */}
                          <td className="py-4 px-4 align-middle whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-fixed/40 text-on-secondary-fixed font-label-md text-label-md font-semibold">
                              <span className="w-2 h-2 rounded-full bg-secondary" />
                              <span>{task.subjectName}</span>
                            </div>
                          </td>

                          {/* Due Date with real overdue badge or Sem prazo */}
                          <td className="py-4 px-4 align-middle whitespace-nowrap">
                            {task.dueDate ? (
                              <div className="flex items-center gap-1.5">
                                {isOverdue ? (
                                  <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-error-container text-on-error-container font-semibold">
                                    Atrasada
                                  </span>
                                ) : (
                                  <span className="font-label-md text-label-md text-on-surface">
                                    {new Date(task.dueDate).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                    })}
                                  </span>
                                )}
                                <span className="font-code-sm text-code-sm text-on-surface-variant">
                                  {new Date(task.dueDate).toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="font-label-md text-label-md text-on-surface-variant italic">
                                Sem prazo
                              </span>
                            )}
                          </td>

                          {/* Priority badge */}
                          <td className="py-4 px-4 align-middle whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold ${
                                task.priority === 'urgente' || task.priority === 'alta'
                                  ? 'text-error'
                                  : task.priority === 'media'
                                  ? 'text-amber-700'
                                  : 'text-outline'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  task.priority === 'urgente'
                                    ? 'bg-error animate-pulse'
                                    : task.priority === 'alta'
                                    ? 'bg-error'
                                    : task.priority === 'media'
                                    ? 'bg-amber-500'
                                    : 'bg-outline'
                                }`}
                              />
                              <span className="capitalize">{task.priority}</span>
                            </span>
                          </td>

                          {/* Status badge */}
                          <td className="py-4 px-4 align-middle whitespace-nowrap">
                            {task.status === 'completed' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-emerald-100 text-emerald-800 font-semibold">
                                Concluída
                              </span>
                            ) : task.status === 'in_progress' ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-secondary text-on-secondary font-semibold shadow-xs">
                                Em Andamento
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-medium">
                                Pendente
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-4 pr-6 pl-4 align-middle text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => navigate('/assistente')}
                                className="p-1.5 rounded-lg text-secondary hover:bg-secondary-fixed/50 transition-colors cursor-pointer"
                                title="Plano de Estudo IA"
                              >
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(task)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                                title="Editar Tarefa"
                              >
                                <span className="material-symbols-outlined text-lg">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePromptDelete(task)}
                                className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors cursor-pointer"
                                title="Excluir Tarefa"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Kanban View Mode */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {[
              {
                id: 'pending',
                title: 'A Fazer / Pendentes',
                count: metrics.pendingCount,
                color: 'border-outline',
              },
              {
                id: 'in_progress',
                title: 'Em Andamento',
                count: metrics.inProgressCount,
                color: 'border-secondary',
              },
              {
                id: 'completed',
                title: 'Concluídas',
                count: metrics.completedCount,
                color: 'border-emerald-600',
              },
            ].map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <div
                  key={col.id}
                  className="bg-surface-container-low p-space-md rounded-2xl flex flex-col gap-space-sm border border-outline-variant/30"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                    <span className="font-title text-title text-on-surface font-bold">
                      {col.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-code-sm text-code-sm bg-surface-container-highest text-on-surface font-semibold">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 min-h-[300px]">
                    {colTasks.length === 0 ? (
                      <p className="font-body-sm text-body-sm text-on-surface-variant text-center py-8">
                        Nenhuma tarefa nesta coluna.
                      </p>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-space-md bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-shadow flex flex-col gap-2 border border-outline-variant/20"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                                {task.subjectName}
                              </span>
                              {task.isDemo && (
                                <span className="px-1.5 py-0.2 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant font-medium">
                                  Demonstração
                                </span>
                              )}
                            </div>
                            <span className="font-code-sm text-code-sm text-on-surface-variant">
                              {task.estimatedTime}
                            </span>
                          </div>

                          <h4
                            onClick={() => handleEdit(task)}
                            className="font-title text-title text-on-surface font-semibold hover:text-secondary cursor-pointer"
                          >
                            {task.title}
                          </h4>

                          <div className="flex items-center justify-between pt-2 border-t border-surface-container-low text-body-sm text-body-sm text-on-surface-variant">
                            <span>
                              {task.dueDate ? (
                                new Date(task.dueDate).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              ) : (
                                <span className="italic">Sem prazo</span>
                              )}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => toggleTaskStatus(task.id)}
                                className="p-1 rounded hover:bg-surface-container text-secondary"
                                title="Alterar status"
                              >
                                <span className="material-symbols-outlined text-base">swap_horiz</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePromptDelete(task)}
                                className="p-1 rounded hover:bg-surface-container text-error"
                                title="Excluir"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View Mode */}
        {viewMode === 'list' && (
          <div className="flex flex-col gap-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-space-md bg-surface-container-lowest rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-space-md border border-outline-variant/30"
              >
                <div className="flex items-center gap-space-md flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => toggleTaskStatus(task.id)}
                    className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        onClick={() => handleEdit(task)}
                        className={`font-title text-title font-semibold text-on-surface truncate cursor-pointer ${
                          task.status === 'completed' ? 'line-through opacity-50' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.isDemo && (
                        <span className="px-1.5 py-0.2 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant font-medium">
                          Demonstração
                        </span>
                      )}
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {task.subjectName} • {task.dueDate ? (
                        `Vence em ${new Date(task.dueDate).toLocaleDateString('pt-BR')} às ${new Date(task.dueDate).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}`
                      ) : (
                        <span className="italic">Sem prazo definido</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(task)}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePromptDelete(task)}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-error"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Three Stitch Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          {/* Card 1: Carga Semanal */}
          <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Carga Semanal de Entregas
                </span>
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">
                  8.5h / 12h
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-2xl">pending_actions</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="flex-1 bg-surface-container-high rounded-full h-2 overflow-hidden">
                <div className="bg-secondary h-2 rounded-full" style={{ width: '72%' }} />
              </div>
              <span className="font-code-sm text-code-sm text-secondary font-semibold">
                72% alocada
              </span>
            </div>
          </div>

          {/* Card 2: Predição */}
          <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                  Predição de Fim de Ciclo [Demonstração]
                </span>
                <span className="font-headline-lg text-headline-lg text-on-surface font-bold mt-1">
                  94% taxa
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
            </div>
            <p className="mt-4 font-body-sm text-body-sm text-on-surface-variant">
              Estimativa do modelo baseada no histórico de entregas e carga horária alocada.
            </p>
          </div>

          {/* Card 3: Otimizador IA */}
          <div className="p-space-lg bg-gradient-to-br from-primary-container to-secondary-container text-on-primary rounded-2xl shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex flex-col gap-1 z-10">
              <div className="flex items-center gap-1.5 text-secondary-fixed">
                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">
                  Otimizador TaskMind IA [Fase 1]
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-primary mt-1">
                Gerar Roteiro de Prova
              </h3>
              <p className="font-body-sm text-body-sm text-on-primary/80 mt-1">
                Estruture metas e planos de estudo escalonados para suas avaliações.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/assistente')}
              className="mt-4 w-fit px-4 py-2 bg-surface-container-lowest text-primary rounded-xl font-label-md text-label-md font-bold shadow-xs hover:bg-surface-container transition-all z-10 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Criar Roteiro (Assistente IA)</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before Task Deletion */}
      <DeleteConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Excluir Tarefa Acadêmica"
        message={`Deseja realmente excluir a tarefa "${taskToDelete?.title}"? Esta ação removerá os registros de checklist e prazos associados.`}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
