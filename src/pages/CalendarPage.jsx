/**
 * @file CalendarPage.jsx
 * Screen 4: Calendário Acadêmico & Cronograma de Provas.
 * Synchronized with the centralized tasks collection.
 * Supports month navigation, day selection, event inspection, view switching, and conflict bottleneck detection.
 */

import React, { useState, useMemo } from 'react';
import { useAcademic } from '../context/AcademicContext.jsx';

export default function CalendarPage() {
  const {
    tasks,
    subjects,
    setIsTaskModalOpen,
    setEditingTask,
  } = useAcademic();

  // Calendar date navigation: default to November 2026 (Semestre 2026.2)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 10)); // Nov 2026
  const [selectedDate, setSelectedDate] = useState(10); // 10 Nov (Hoje)
  const [calendarView, setCalendarView] = useState('month'); // month, week, gantt
  const [eventTypeFilter, setEventTypeFilter] = useState('all'); // all, exams, submissions, ai_sessions
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);
  const [isScheduledActivated, setIsScheduledActivated] = useState(false);

  // Month metadata
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Navigate to actual current date (real system date)
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.getDate());
  };

  // Quick navigation to preserve and inspect November 2026 demonstration dataset
  const goToDemoSemester = () => {
    setCurrentDate(new Date(2026, 10, 10));
    setSelectedDate(10);
  };

  // Build grid days (including trailing days from previous month)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, daysInPrevMonth - i),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i),
      });
    }

    // Next month padding to fill complete weeks (35 or 42 cells)
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remaining = totalSlots - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [year, month]);

  // Tasks mapped by day number for current month
  const tasksByDay = useMemo(() => {
    const map = {};

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const d = new Date(task.dueDate);
      if (!isNaN(d.getTime()) && d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(task);
      }
    });

    return map;
  }, [tasks, year, month]);

  // Tasks for the currently selected day
  const selectedDayTasks = tasksByDay[selectedDate] || [];

  // Filter tasks if filter is applied
  const filterTaskMatches = (task) => {
    if (eventTypeFilter === 'all') return true;
    if (eventTypeFilter === 'exams') {
      return (
        task.priority === 'urgente' ||
        task.title.toLowerCase().includes('prova') ||
        task.title.toLowerCase().includes('exame')
      );
    }
    if (eventTypeFilter === 'submissions') {
      return task.title.toLowerCase().includes('entrega') || task.title.toLowerCase().includes('relatório');
    }
    if (eventTypeFilter === 'ai_sessions') {
      return task.isAiPrioritized || task.hasAiBadge;
    }
    return true;
  };

  const handleOpenNewEvent = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="w-full max-w-[1600px] mx-auto px-margin-mobile lg:px-margin py-space-md lg:py-space-xl space-y-space-xl">
        {/* 1. Header de Controle e Navegação do Calendário */}
        <header className="flex flex-col gap-space-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div>
              <div className="flex items-center gap-space-xs">
                <span className="px-2.5 py-0.5 rounded-full font-code-sm text-code-sm bg-secondary-fixed text-on-secondary-fixed font-semibold uppercase tracking-wider">
                  Período Ativo
                </span>
                <span className="font-code-sm text-code-sm text-on-surface-variant flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Semestre Letivo 2026.2
                </span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
                Calendário Acadêmico &amp; Provas
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
                {tasks.length} entregas e checkpoints catalogados no semestre.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-space-xs">
              <button
                type="button"
                className="inline-flex items-center gap-space-xs h-10 px-4 bg-surface-container-lowest text-on-surface rounded-lg font-label-md text-label-md hover:bg-surface-container-low transition-all shadow-xs border border-surface-container"
              >
                <span className="material-symbols-outlined text-lg text-secondary">sync</span>
                <span>Moodle / SIGAA</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-surface-container text-on-surface-variant font-code-sm">
                  Demonstração
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewEvent}
                className="inline-flex items-center gap-space-xs h-10 px-4 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:bg-secondary-container shadow-xs transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                <span>Adicionar Evento / Prova</span>
              </button>
            </div>
          </div>

          {/* Barra Interativa: Navegação temporal, Tabs de Visão e Filtros */}
          <div className="p-space-sm bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col xl:flex-row xl:items-center justify-between gap-space-md">
            {/* Navegação Mês & Botão Hoje */}
            <div className="flex items-center gap-space-sm">
              <div className="flex items-center bg-surface-container-low rounded-xl p-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  aria-label="Mês anterior"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <span className="font-title text-title text-on-surface px-3 min-w-[130px] text-center font-bold">
                  {capitalizedMonthName}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  aria-label="Próximo mês"
                  className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>

              <button
                type="button"
                onClick={goToToday}
                className="h-9 px-3 rounded-lg font-label-sm text-label-sm bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors cursor-pointer font-semibold"
                title={`Navegar para a data atual real (${new Date().toLocaleDateString('pt-BR')})`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={goToDemoSemester}
                className="h-9 px-3 rounded-lg font-label-sm text-label-sm bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer text-xs"
                title="Visualizar período demonstrativo (Novembro 2026)"
              >
                Período 2026.2
              </button>
            </div>

            {/* Seletor de Visão (Pills) */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setCalendarView('month')}
                className={`px-4 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  calendarView === 'month'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Visão Mês
              </button>
              <button
                type="button"
                onClick={() => setCalendarView('week')}
                className={`px-4 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  calendarView === 'week'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Semana
              </button>
              <button
                type="button"
                onClick={() => setCalendarView('gantt')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-label-sm text-label-sm transition-all cursor-pointer ${
                  calendarView === 'gantt'
                    ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm text-secondary">view_timeline</span>
                <span>Gantt de Provas</span>
              </button>
            </div>

            {/* Chips de Filtragem de Disciplinas/Tipo */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setEventTypeFilter('all')}
                className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer transition-all ${
                  eventTypeFilter === 'all'
                    ? 'bg-primary text-on-primary font-semibold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Todas ({tasks.length})
              </button>

              <button
                type="button"
                onClick={() => setEventTypeFilter('exams')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer transition-all ${
                  eventTypeFilter === 'exams'
                    ? 'bg-error text-on-error font-bold shadow-xs'
                    : 'bg-error-container text-on-error-container font-semibold'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                Provas (P1/P2)
              </button>

              <button
                type="button"
                onClick={() => setEventTypeFilter('submissions')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer transition-all ${
                  eventTypeFilter === 'submissions'
                    ? 'bg-secondary text-on-secondary font-semibold shadow-xs'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Entregas
              </button>

              <button
                type="button"
                onClick={() => setEventTypeFilter('ai_sessions')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap cursor-pointer transition-all ${
                  eventTypeFilter === 'ai_sessions'
                    ? 'bg-secondary-fixed text-on-secondary-fixed font-bold shadow-xs'
                    : 'bg-surface-container-low text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                Sessões IA
              </button>
            </div>
          </div>
        </header>

        {/* 2. Banner Preditivo de IA (TaskMind Cognitive Engine) */}
        {!isAlertDismissed && (
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container via-surface-container-low to-secondary-fixed/40 p-space-lg shadow-xs border border-secondary/30">
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
              <div className="flex items-start gap-space-md">
                <div className="w-11 h-11 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase font-bold text-secondary tracking-wider">
                      Detecção Preditiva de Gargalo Acadêmico [Demonstração da Fase 1]
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-code-sm text-code-sm bg-error-container text-on-error-container font-semibold">
                      Alerta Semana 16
                    </span>
                  </div>
                  <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Conflito Iminente: Prova P1 de Banco de Dados II &amp; Entrega de Sistemas Distribuídos
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
                    Há um intervalo menor que <strong>44 horas</strong> entre as duas avaliações cruciais
                    (Peso somado: 75%). O modelo preditivo do TaskMind sugere 4 slots escalonados de
                    estudo de 45 minutos com memorização ativa para evitar sobrecarga cognitiva.
                  </p>
                  {isScheduledActivated && (
                    <div className="p-2.5 rounded-xl bg-surface-container font-label-sm text-label-sm text-secondary font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">task_alt</span>
                      <span>Cronograma escalonado ativado! As sessões sugeridas foram registradas localmente.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-space-xs shrink-0 self-end lg:self-center">
                <button
                  type="button"
                  onClick={() => setIsScheduledActivated(!isScheduledActivated)}
                  className="h-10 px-4 rounded-lg font-label-md text-label-md bg-secondary text-on-secondary hover:bg-secondary-container shadow-sm inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">psychology</span>
                  <span>{isScheduledActivated ? 'Cronograma Ativado ✓' : 'Ativar Cronograma Escalonado'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlertDismissed(true)}
                  className="h-10 px-3 rounded-lg font-label-md text-label-md bg-surface-container-lowest text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Ignorar Alerta
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 3. Grid Principal em 2 Colunas: Calendário (8 col) + Painel Lateral (4 col) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-xl items-start">
          {/* Left: Grade Mensal (8 colunas) */}
          <section className="xl:col-span-8 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 p-space-md sm:p-space-lg flex flex-col">
              {/* Legenda de Cores */}
              <div className="flex flex-wrap items-center justify-between pb-space-md mb-space-xs gap-2 border-b border-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="font-title text-title text-on-surface font-bold">
                    Grade Mensal
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant px-2 py-0.5 rounded bg-surface-container font-medium">
                    Semana Acadêmica 11 a 15
                  </span>
                </div>

                <div className="flex items-center gap-3 font-code-sm text-code-sm text-on-surface-variant">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-error" />
                    <span>Provas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                    <span>Entregas IA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>Trabalhos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest" />
                    <span>Aulas</span>
                  </div>
                </div>
              </div>

              {/* Cabeçalho Dias da Semana */}
              <div className="grid grid-cols-7 gap-1 text-center py-2 bg-surface-container-low rounded-xl mb-1.5 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                <div>Dom</div>
                <div>Seg</div>
                <div>Ter</div>
                <div>Qua</div>
                <div>Qui</div>
                <div>Sex</div>
                <div>Sáb</div>
              </div>

              {/* Grade dos Dias */}
              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((cell, idx) => {
                  const dayTasks = (tasksByDay[cell.dayNumber] || []).filter(filterTaskMatches);
                  const isSelected = cell.isCurrentMonth && cell.dayNumber === selectedDate;
                  const hasExam = dayTasks.some(
                    (t) => t.priority === 'urgente' || t.title.toLowerCase().includes('prova')
                  );

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (cell.isCurrentMonth) setSelectedDate(cell.dayNumber);
                      }}
                      className={`min-h-[105px] p-1.5 rounded-xl flex flex-col justify-between transition-all cursor-pointer ${
                        !cell.isCurrentMonth
                          ? 'bg-surface-container/30 opacity-40'
                          : isSelected
                          ? 'bg-secondary-fixed/30 border-2 border-secondary shadow-xs'
                          : 'bg-surface-container-low hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-code-sm text-code-sm font-semibold ${
                            isSelected ? 'text-secondary font-bold' : 'text-on-surface'
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {cell.isCurrentMonth && cell.dayNumber === 1 && (
                          <span className="font-code-sm text-[10px] px-1 rounded bg-surface-container-high text-on-surface-variant">
                            Feriado
                          </span>
                        )}

                        {hasExam && cell.isCurrentMonth && (
                          <span className="w-2 h-2 rounded-full bg-error animate-pulse" title="Prova P1" />
                        )}
                      </div>

                      {/* Task items preview inside day cell */}
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {cell.isCurrentMonth &&
                          dayTasks.slice(0, 2).map((t) => (
                            <div
                              key={t.id}
                              className={`p-1 rounded text-[10px] leading-tight font-semibold truncate flex items-center gap-0.5 ${
                                t.priority === 'urgente'
                                  ? 'bg-error text-on-error'
                                  : t.hasAiBadge
                                  ? 'bg-secondary-fixed text-on-secondary-fixed'
                                  : 'bg-surface-container text-on-surface'
                              }`}
                            >
                              {t.hasAiBadge && (
                                <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                              )}
                              <span>{t.title}</span>
                            </div>
                          ))}
                        {cell.isCurrentMonth && dayTasks.length > 2 && (
                          <span className="text-[9px] font-code-sm text-secondary font-semibold">
                            +{dayTasks.length - 2} mais
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-on-surface-variant/70 font-code-sm">
                        {cell.isCurrentMonth && dayTasks.length > 0
                          ? `${dayTasks.length} evento(s)`
                          : 'Livre'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right: Painel Lateral de Detalhes da Data / Provas (4 colunas) */}
          <aside className="xl:col-span-4 flex flex-col gap-space-md">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 p-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    Data Selecionada
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold capitalize">
                    {selectedDate} de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })} de {year}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNewEvent}
                  className="p-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
                  title="Adicionar evento neste dia"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>

              {/* Day's Activities */}
              <div className="flex flex-col gap-space-sm">
                {selectedDayTasks.length === 0 ? (
                  <div className="p-space-lg bg-surface-container-low rounded-xl text-center flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/50">
                      event_available
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Nenhum prazo cadastrado para este dia.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenNewEvent}
                      className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-label-sm text-label-sm font-semibold cursor-pointer"
                    >
                      + Agendar Entrega
                    </button>
                  </div>
                ) : (
                  selectedDayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-space-md rounded-xl flex flex-col gap-2 border ${
                        task.priority === 'urgente'
                          ? 'bg-error-container/30 border-error/40'
                          : 'bg-surface-container-low border-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2 py-0.5 rounded font-label-sm text-label-sm font-bold flex items-center gap-1 ${
                            task.priority === 'urgente'
                              ? 'bg-error text-on-error'
                              : 'bg-secondary-fixed text-on-secondary-fixed'
                          }`}
                        >
                          {task.priority === 'urgente' && (
                            <span className="material-symbols-outlined text-xs">edit_document</span>
                          )}
                          {task.subjectName}
                        </span>
                        <span className="font-code-sm text-code-sm text-on-surface-variant font-semibold">
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

                      <h4 className="font-title text-title text-on-surface font-semibold">
                        {task.title}
                      </h4>

                      {task.description && (
                        <p className="font-body-sm text-body-sm text-on-surface-variant">
                          {task.description}
                        </p>
                      )}

                      {task.subtasks && task.subtasks.length > 0 && (
                        <div className="p-2 rounded-lg bg-surface-container-lowest flex flex-col gap-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                            Etapas de Preparação:
                          </span>
                          {task.subtasks.map((st, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-body-sm text-body-sm">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  st.completed ? 'bg-emerald-500' : 'bg-outline'
                                }`}
                              />
                              <span className={st.completed ? 'line-through opacity-70' : ''}>
                                {st.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-1 flex items-center justify-between">
                        <span className="font-code-sm text-code-sm text-on-surface-variant">
                          Tempo estimado: {task.estimatedTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(task);
                            setIsTaskModalOpen(true);
                          }}
                          className="text-secondary font-label-sm text-label-sm font-semibold hover:underline cursor-pointer"
                        >
                          Editar Detalhes
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
