/**
 * @file DashboardPage.jsx
 * Screen 1: Visão Geral — Dashboard Acadêmico TaskMind.
 * Directly calculates and displays all metrics, tasks and upcoming exams from centralized state.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext.jsx';

export default function DashboardPage() {
  const {
    subjects,
    settings,
    metrics,
    toggleTaskStatus,
    setIsTaskModalOpen,
    setEditingTask,
  } = useAcademic();

  const navigate = useNavigate();

  // Local state for banner visibility and filter
  const [isAiBannerVisible, setIsAiBannerVisible] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState('all');

  const filteredPriorities = metrics.activePriorities.filter((task) => {
    if (selectedDisciplineFilter === 'all') return true;
    return task.subjectId === selectedDisciplineFilter;
  });

  const handleOptimizeSchedule = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      setIsOptimized(true);
    }, 800);
  };

  const handleOpenTask = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Dynamic Gradient Ambient Backdrop for Depth */}
      <div className="relative w-full px-space-md lg:px-margin py-space-xl max-w-7xl mx-auto flex flex-col gap-space-xl">
        {/* Ambient Soft Glow Elements */}
        <div className="absolute -top-12 right-12 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-80 left-0 w-80 h-80 bg-surface-container-high/60 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* 1. Header & Quick Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm w-fit shadow-xs">
              <span className="material-symbols-outlined text-sm text-secondary">auto_awesome</span>
              <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}{settings.user.semester ? ` • Semestre ${settings.user.semester}` : ''}</span>
            </div>
            <h1 className="font-display text-display text-on-surface tracking-tight">
              Olá, {settings.user.name || 'estudante'}! <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Você tem{' '}
              <strong className="text-on-surface font-semibold">
                {metrics.pendingCount} entregas prioritárias
              </strong>{' '}
              no momento, com {metrics.overdueCount} tarefa(s) atrasada(s).
            </p>
          </div>

          {/* Filters & Academic Segment Selectors */}
          <div className="flex flex-wrap items-center gap-space-sm bg-surface-container-lowest p-1.5 rounded-xl shadow-xs border border-surface-container-high">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-secondary text-lg pointer-events-none">
                school
              </span>
              <select className="pl-9 pr-8 py-2 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container transition-colors appearance-none cursor-pointer">
                <option>{settings.user.semester ? `Semestre ${settings.user.semester}` : 'Período atual'}</option>
                <option>Histórico Geral</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-base pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-lg pointer-events-none">
                filter_list
              </span>
              <select
                value={selectedDisciplineFilter}
                onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface focus:outline-none focus:bg-surface-container transition-colors appearance-none cursor-pointer"
              >
                <option value="all">Todas as Disciplinas</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 text-on-surface-variant text-base pointer-events-none">
                expand_more
              </span>
            </div>
          </div>
        </div>

        {/* 2. Summary Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Card 1: Pendentes */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-space-md group relative overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-xl">pending_actions</span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-code-sm text-code-sm bg-tertiary-fixed text-on-tertiary-fixed font-medium">
                +{metrics.pendingCount} ativas
              </span>
            </div>
            <div>
              <span className="font-display text-display text-on-surface tracking-tight leading-none block">
                {String(metrics.pendingCount).padStart(2, '0')}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-1 block">
                Tarefas Pendentes
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
              <div
                className="bg-primary h-1 rounded-full"
                style={{
                  width: `${Math.min(100, (metrics.pendingCount / (metrics.totalCount || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Card 2: Concluídas */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-space-md group relative overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-xl">task_alt</span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> 82% da meta
              </span>
            </div>
            <div>
              <span className="font-display text-display text-on-surface tracking-tight leading-none block">
                {String(metrics.completedCount).padStart(2, '0')}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-1 block">
                Concluídas no Mês
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-1 overflow-hidden">
              <div className="bg-secondary h-1 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>

          {/* Card 3: Prazos Atrasados */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-space-md group relative overflow-hidden border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-error-container text-on-error-container font-semibold">
                {metrics.overdueCount > 0 ? 'Crítico' : 'Sob Controle'}
              </span>
            </div>
            <div>
              <span className="font-display text-display text-error tracking-tight leading-none block">
                {String(metrics.overdueCount).padStart(2, '0')}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-1 block">
                Prazos Atrasados
              </span>
            </div>
            <p className="font-code-sm text-code-sm text-error truncate font-medium">
              {metrics.overdueCount > 0 ? 'Requer atenção imediata' : 'Nenhuma entrega atrasada hoje'}
            </p>
          </div>

          {/* Card 4: Horas Focadas (IA) */}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-space-md group relative overflow-hidden bg-gradient-to-br from-surface-container-lowest via-surface-container-lowest to-secondary-fixed/20 border border-outline-variant/30">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary">
                <span className="material-symbols-outlined text-xl">timer</span>
              </div>
              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">bolt</span> 94% Eficácia
              </span>
            </div>
            <div>
              <span className="font-display text-display text-on-surface tracking-tight leading-none block">
                24.5<span className="text-headline-md font-code-sm text-secondary">h</span>
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant mt-1 block">
                Horas de Estudo Focadas
              </span>
            </div>
            <div className="flex items-center justify-between text-code-sm font-code-sm text-on-surface-variant">
              <span>Meta: 30h</span>
              <span className="text-secondary font-semibold">+4h hoje</span>
            </div>
          </div>
        </div>

        {/* 5. TaskMind AI Spark Insight Banner */}
        {isAiBannerVisible && (
          <div className="relative w-full rounded-2xl bg-primary-container text-on-primary p-space-lg lg:p-space-xl overflow-hidden shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg transition-all duration-300">
            <div className="absolute -right-8 -top-8 w-64 h-64 bg-secondary-container/30 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-start gap-space-md relative z-10 max-w-3xl">
              <div className="p-3 bg-secondary rounded-xl text-on-secondary shrink-0 shadow-md">
                <span className="material-symbols-outlined text-2xl">lightbulb</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-code-sm text-code-sm uppercase tracking-wider text-secondary-fixed font-semibold">
                    Insight Preditivo TaskMind AI [Demonstração da Fase 1]
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
                </div>
                <p className="font-headline-sm text-headline-sm text-white font-semibold">
                  Conflito de carga horária detectado para Quinta-feira
                </p>
                <p className="font-body-md text-body-md text-inverse-primary leading-relaxed">
                  Você tem 2 entregas complexas no mesmo dia. Deseja que a IA decomponha o{' '}
                  <strong className="text-white">Trabalho de Sistemas Distribuídos</strong> em 3
                  micro-etapas focadas de 45 min para hoje e amanhã?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-sm w-full md:w-auto shrink-0 relative z-10">
              <button
                type="button"
                onClick={() => setIsAiBannerVisible(false)}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-lg bg-primary-container/80 text-on-primary-container hover:text-white font-label-md text-label-md transition-colors text-center cursor-pointer"
              >
                Dispensar
              </button>
              <button
                type="button"
                onClick={handleOptimizeSchedule}
                disabled={isOptimizing}
                className={`flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-label-md text-label-md shadow-md transition-all cursor-pointer ${
                  isOptimized
                    ? 'bg-surface-container-highest text-on-surface'
                    : 'bg-secondary text-on-secondary hover:bg-secondary-container'
                }`}
              >
                <span className={`material-symbols-outlined text-base ${isOptimizing ? 'animate-spin' : ''}`}>
                  {isOptimizing ? 'progress_activity' : isOptimized ? 'check' : 'auto_fix_high'}
                </span>
                <span>
                  {isOptimizing
                    ? 'Reestruturando tarefas...'
                    : isOptimized
                    ? 'Cronograma Otimizado!'
                    : 'Otimizar com IA'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Dual-Column Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Left Column: Prioridades de Hoje (8 Cols Desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-2xl">flag</span>
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Prioridades de Hoje
                </h2>
                <span className="ml-2 px-2 py-0.5 rounded-full font-code-sm text-code-sm bg-surface-container-high text-on-surface font-semibold">
                  {filteredPriorities.length} tarefas
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/tarefas')}
                className="text-secondary hover:text-on-surface font-label-md text-label-md font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                <span>Ver Todas as Tarefas</span>
              </button>
            </div>

            {/* Priority Task Cards Container */}
            <div className="flex flex-col gap-space-sm" id="priorities-list">
              {filteredPriorities.length === 0 ? (
                <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs text-center text-on-surface-variant">
                  <p className="font-body-md text-body-md">
                    Nenhuma tarefa pendente encontrada para este filtro.
                  </p>
                </div>
              ) : (
                filteredPriorities.map((task) => {
                  const isChecked = task.status === 'completed';
                  return (
                    <div
                      key={task.id}
                      className={`group bg-surface-container-lowest p-space-md rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-l-4 ${
                        task.priority === 'urgente'
                          ? 'border-error'
                          : task.priority === 'alta'
                          ? 'border-secondary'
                          : 'border-surface-container-highest'
                      } border-t border-r border-b border-outline-variant/30`}
                    >
                      <div className="flex items-start gap-space-md min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id)}
                          aria-label={`Marcar como concluída: ${task.title}`}
                          className={`mt-1 w-5 h-5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-secondary text-on-secondary shadow-xs'
                              : 'bg-surface-container text-transparent hover:text-on-surface-variant'
                          }`}
                        >
                          <span className="material-symbols-outlined text-base">check</span>
                        </button>

                        <div className="flex flex-col min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant flex items-center gap-1">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  task.priority === 'urgente'
                                    ? 'bg-error'
                                    : task.priority === 'alta'
                                    ? 'bg-secondary'
                                    : 'bg-primary'
                                }`}
                              />
                              {task.subjectName}
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold capitalize ${
                                task.priority === 'urgente'
                                  ? 'bg-error-container text-on-error-container'
                                  : task.priority === 'alta'
                                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                                  : 'bg-surface-container text-on-surface-variant'
                              }`}
                            >
                              {task.priority}
                            </span>

                            {task.isDemo && (
                              <span className="px-1.5 py-0.5 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant font-medium">
                                Demonstração
                              </span>
                            )}

                            {task.hasAiBadge && (
                              <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                                {task.aiBadgeText || 'IA Otimizado'}
                              </span>
                            )}

                            <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {task.dueDate ? (
                                new Date(task.dueDate).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              ) : (
                                'Sem prazo'
                              )}
                            </span>
                          </div>

                          <h3
                            onClick={() => handleOpenTask(task)}
                            className={`font-title text-title text-on-surface truncate group-hover:text-secondary transition-colors font-semibold cursor-pointer ${
                              isChecked ? 'line-through opacity-50' : ''
                            }`}
                          >
                            {task.title}
                          </h3>

                          {task.description && (
                            <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-space-md shrink-0 pt-2 sm:pt-0">
                        <div className="flex items-center gap-1 font-code-sm text-code-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-lg">
                          <span className="material-symbols-outlined text-sm">timelapse</span>
                          <span>{task.estimatedTime || '1h 00m'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenTask(task)}
                          className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                          title="Ver detalhes da tarefa"
                        >
                          <span className="material-symbols-outlined text-xl">more_vert</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Academic Resource Snippet Visual Card */}
            <div className="mt-space-md bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs flex flex-col md:flex-row items-center gap-space-lg border border-outline-variant/30">
              <div className="w-full md:w-48 h-32 rounded-xl overflow-hidden shrink-0 relative bg-surface-container">
                <img
                  className="w-full h-full object-cover"
                  alt="Mesa de estudos da biblioteca central"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDk08yZQPQAyqGup76D0UkpJcjkQmshhAL6G2Ak8dgaJ2HHOVN9LegdRwtzjBfmT4TUiXjeBRMgJQOLRcZc3Gg_3qK1mIslCSq15dcLPwbCgTLuzGho569SLQtRSrENTAC67_cEyGnBmxFkmT4dLu_eOxxvewnKTqINH49zcuHCeZukA4e7LdHlu8TO1tYZAwIxY-gz2kbxiaicTyD9vnTtPONod8_ucyGYyVD14sA"
                />
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px]" />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-surface text-on-surface font-code-sm text-code-sm font-semibold">
                  Biblioteca Central
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">local_library</span>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    Espaço de Concentração • Integração Simulada
                  </span>
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Sala de Estudo Silencioso 12B [Exemplo Demonstrativo]
                </h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Demonstração da interface de agendamento universitário. A sincronização de reservas
                  em tempo real com a biblioteca central será ativada na Fase 2.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Próximos Prazos & Provas (4 Cols Desktop) */}
          <div className="lg:col-span-4 flex flex-col gap-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-secondary text-2xl">event_upcoming</span>
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Próximos Prazos
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/calendario')}
                className="text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-medium cursor-pointer"
              >
                Ver mês
              </button>
            </div>

            <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-xs flex flex-col gap-space-lg border border-outline-variant/30">
              {/* Mini Horizontal Day Scroller: Tuesday Nov 10 to Saturday Nov 14, 2026 */}
              <div className="flex items-center justify-between gap-1 pb-space-sm border-b border-surface-container-low">
                {[
                  { day: 'TER', date: '10', active: true, title: 'Hoje' },
                  { day: 'QUA', date: '11', hasDot: true },
                  { day: 'QUI', date: '12', hasDot: true },
                  { day: 'SEX', date: '13', hasExam: true, title: 'Prova P1' },
                  { day: 'SÁB', date: '14', faded: true },
                ].map((d, i) => (
                  <div
                    key={i}
                    onClick={() => navigate('/calendario')}
                    title={d.title || ''}
                    className={`flex flex-col items-center p-2 rounded-xl w-12 cursor-pointer transition-colors ${
                      d.active
                        ? 'bg-secondary text-on-secondary shadow-xs'
                        : d.faded
                        ? 'hover:bg-surface-container-low text-on-surface opacity-50'
                        : 'hover:bg-surface-container-low text-on-surface'
                    }`}
                  >
                    <span className="font-label-sm text-label-sm">{d.day}</span>
                    <span className="font-title text-title font-bold">{d.date}</span>
                    {d.hasExam && (
                      <span className="w-1.5 h-1.5 rounded-full bg-error mt-1" title="Prova P1" />
                    )}
                    {d.active && <span className="w-1.5 h-1.5 rounded-full bg-on-secondary mt-1" />}
                    {d.hasDot && !d.hasExam && (
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary-container mt-1" />
                    )}
                  </div>
                ))}
              </div>

              {/* Chronological Exam and Assessment Cards */}
              <div className="flex flex-col gap-space-md">
                {/* Deadline 1: Prova Presencial (Friday Nov 13, 2026) */}
                <div className="relative p-space-md rounded-xl bg-error-container/30 flex flex-col gap-2 border border-error/20">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-error text-on-error font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">edit_document</span> PROVA P1
                    </span>
                    <span className="font-code-sm text-code-sm text-error font-semibold">
                      Sex, 13 Nov • 14:00
                    </span>
                  </div>
                  <h4 className="font-title text-title text-on-surface font-semibold">
                    Banco de Dados II: Modelagem &amp; SQL Avançado
                  </h4>
                  <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-sm text-error">room</span>
                    <span>Sala 304 • Bloco B (Campus Central)</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="font-code-sm text-code-sm text-on-surface-variant">
                      Peso na Média: 40%
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate('/disciplinas')}
                      className="text-error font-label-sm text-label-sm font-semibold hover:underline cursor-pointer"
                    >
                      Ver Tópicos de Estudo
                    </button>
                  </div>
                </div>

                {/* Deadline 2: Trabalho em Grupo (Thursday Nov 12, 2026) */}
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                      Trabalho em Equipe
                    </span>
                    <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
                      Qui, 12 Nov • 23:59
                    </span>
                  </div>
                  <h4 className="font-title text-title text-on-surface font-semibold">
                    Sistema Distribuído de Microserviços
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Engenharia de Software • Entrega do repositório Git e documentação OpenAPI.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <span className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-surface-container-highest text-center font-code-sm text-code-sm pt-0.5 font-bold">
                        MS
                      </span>
                      <span className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-primary-fixed-dim text-center font-code-sm text-code-sm pt-0.5 font-bold">
                        GC
                      </span>
                      <span className="inline-block h-6 w-6 rounded-full ring-2 ring-surface bg-tertiary-fixed text-center font-code-sm text-code-sm pt-0.5 font-bold">
                        LA
                      </span>
                    </div>
                    <span className="font-code-sm text-code-sm text-secondary font-semibold">
                      3/5 etapas prontas
                    </span>
                  </div>
                </div>

                {/* Deadline 3: Apresentação (Saturday Nov 14, 2026) */}
                <div className="p-space-md rounded-xl bg-surface-container-low flex flex-col gap-2 hover:bg-surface-container transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-semibold">
                      Seminário Prático
                    </span>
                    <span className="font-code-sm text-code-sm text-on-surface-variant font-medium">
                      Sáb, 14 Nov • 19:00
                    </span>
                  </div>
                  <h4 className="font-title text-title text-on-surface font-semibold">
                    Apresentação: Interação Humano-Computador
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Defesa dos testes de usabilidade com protótipo em alta fidelidade.
                  </p>
                  <div className="flex items-center gap-1 text-on-surface-variant font-body-sm text-body-sm pt-1">
                    <span className="material-symbols-outlined text-sm">videocam</span>
                    <span>Laboratório de Mídia 02 ou Sala Virtual</span>
                  </div>
                </div>
              </div>

              {/* Academic Performance Mini Gauge */}
              <div className="p-space-md bg-surface-container rounded-xl flex items-center justify-between gap-space-md">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                    IRA Estimado
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    {metrics.calculatedIra} / 10.0
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary font-medium">
                    Top 5% da turma [Demonstração]
                  </span>
                </div>

                {/* SVG Progress Ring Gauge */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-highest"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${Number(metrics.calculatedIra) * 10}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="material-symbols-outlined absolute text-secondary text-lg">
                    military_tech
                  </span>
                </div>
              </div>
            </div>

            {/* Campus Quick Notice */}
            <div className="p-space-md rounded-2xl bg-surface-container-lowest shadow-xs flex items-center gap-space-md border border-outline-variant/30">
              <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-on-surface shrink-0">
                <span className="material-symbols-outlined text-xl">campaign</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-label-sm text-label-sm font-semibold text-on-surface truncate">
                    Aviso da Secretaria Geral
                  </span>
                  <span className="px-1.5 py-0.2 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant">
                    Exemplo
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  Inscrições abertas para monitoria bolsista 2026.2 até 25/11.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
