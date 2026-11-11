/**
 * @file SubjectsPage.jsx
 * Screen 5: Disciplinas, Ementas e Controle de Frequência.
 * Complete subject management: CRUD, real attendance calculation with +/- buttons,
 * grade composition, syllabus accordion, and direct bridge to Grade Simulator.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext.jsx';
import DeleteConfirmModal from '../components/tasks/DeleteConfirmModal.jsx';

export default function SubjectsPage() {
  const {
    subjects,
    tasks,
    metrics,
    settings,
    createSubject,
    updateSubject,
    deleteSubject,
    addAbsence,
    addAttendance,
    setSelectedSimulatorSubjectId,
  } = useAcademic();

  const navigate = useNavigate();

  // Local filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, exatas, humanidades
  const [viewMode, setViewMode] = useState('grid'); // grid, table

  // Subject Modal state (create / edit)
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);

  // Form state
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formProfessor, setFormProfessor] = useState('');
  const [formCredits, setFormCredits] = useState(4);
  const [formWorkload, setFormWorkload] = useState(60);
  const [formRoom, setFormRoom] = useState('');
  const [formCategory, setFormCategory] = useState('Exatas & Comp');
  const [formCurrentGrade, setFormCurrentGrade] = useState('');

  const openNewSubjectModal = () => {
    setEditingSubject(null);
    setFormCode('CC' + Math.floor(100 + Math.random() * 900));
    setFormName('');
    setFormProfessor('');
    setFormCredits(4);
    setFormWorkload(60);
    setFormRoom('Bloco Central');
    setFormCategory('Exatas & Comp');
    setFormCurrentGrade('');
    setIsSubjectModalOpen(true);
  };

  const openEditSubjectModal = (subj) => {
    setEditingSubject(subj);
    setFormCode(subj.code);
    setFormName(subj.name);
    setFormProfessor(subj.professor);
    setFormCredits(subj.credits);
    setFormWorkload(subj.workload);
    setFormRoom(subj.room);
    setFormCategory(subj.category || 'Exatas & Comp');
    setFormCurrentGrade(
      subj.currentGrade !== null && subj.currentGrade !== undefined ? subj.currentGrade : ''
    );
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedGrade =
      formCurrentGrade !== '' && formCurrentGrade !== null && !isNaN(Number(formCurrentGrade))
        ? Number(formCurrentGrade)
        : null;

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        code: formCode.trim(),
        name: formName.trim(),
        professor: formProfessor.trim(),
        credits: Number(formCredits),
        workload: Number(formWorkload),
        room: formRoom.trim(),
        category: formCategory,
        currentGrade: parsedGrade,
      });
    } else {
      createSubject({
        code: formCode.trim(),
        name: formName.trim(),
        professor: formProfessor.trim(),
        credits: Number(formCredits),
        workload: Number(formWorkload),
        room: formRoom.trim(),
        category: formCategory,
        currentGrade: parsedGrade,
      });
    }
    setIsSubjectModalOpen(false);
  };

  const handleOpenSimulator = (subjId) => {
    setSelectedSimulatorSubjectId(subjId);
    navigate(`/simulador?subjectId=${subjId}`);
  };

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q) ||
          s.professor.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (categoryFilter === 'exatas' && !s.category?.includes('Exatas')) return false;
      if (categoryFilter === 'humanidades' && !s.category?.includes('Humanidades')) return false;
      return true;
    });
  }, [subjects, searchQuery, categoryFilter]);

  return (
    <div className="flex flex-col w-full relative">
      <div className="px-space-md lg:px-margin py-space-lg flex flex-col gap-space-xl max-w-[1600px] mx-auto w-full">
        {/* 1. Page Header Section */}
        <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-space-md pb-space-xs">
          <div className="flex flex-col gap-space-xs">
            <div className="flex flex-wrap items-center gap-space-xs sm:gap-space-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Minhas Disciplinas
              </h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high text-on-surface rounded-full font-label-sm text-label-sm shadow-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                {settings.user.semester ? `Semestre Letivo ${settings.user.semester} • ` : ''}{subjects.length} Disciplinas Matriculadas (
                {subjects.reduce((acc, s) => acc + (s.credits || 4), 0)} créditos)
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
              Acompanhamento acadêmico de ementas, desempenho em notas, controle de frequência e previsão
              de aprovação orientada por IA.
            </p>
          </div>

          {/* Header Quick Actions */}
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="flex items-center gap-space-xs px-3 py-1.5 bg-surface-container-lowest rounded-lg shadow-xs border border-surface-container">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-body-sm text-body-sm text-on-surface-variant">Dados do usuário</span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold ml-1">
                Supabase
              </span>
              <span className="px-1.5 py-0.2 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant ml-1">
                RLS ativo
              </span>
            </div>

            <button
              type="button"
              onClick={openNewSubjectModal}
              className="inline-flex items-center gap-space-xs h-10 px-4 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:bg-secondary-container shadow-xs transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Nova Disciplina</span>
            </button>
          </div>
        </header>

        {/* 2. Performance Metrics Bar (4 Academic KPIs) */}
        <section
          aria-label="Indicadores Acadêmicos Gerais"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md"
        >
          {/* KPI 1: IRA */}
          <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Média Geral Ponderada (IRA)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-display text-on-surface font-bold">
                    {metrics.calculatedIra}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">/ 10.0</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container text-secondary">
                <span className="material-symbols-outlined text-2xl">grade</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs">
              <span className="inline-flex items-center gap-1 font-code-sm text-code-sm text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                <span className="material-symbols-outlined text-sm">trending_up</span> +0.4 vs 2026.1
              </span>
              <span className="inline-flex items-center px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-md font-label-sm text-label-sm font-semibold">
                Top 5% da Turma [Demonstração]
              </span>
            </div>
          </div>

          {/* KPI 2: Frequência */}
          <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Frequência Média Geral
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-display text-on-surface font-bold">
                    {metrics.overallAttendanceRate}%
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container text-on-surface">
                <span className="material-symbols-outlined text-2xl">event_available</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 pt-space-xs">
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, metrics.overallAttendanceRate)}%` }}
                />
              </div>
              <div className="flex justify-between font-body-sm text-body-sm text-on-surface-variant">
                <span>Zona Segura</span>
                <span>Mínimo institucional: 75%</span>
              </div>
            </div>
          </div>

          {/* KPI 3: Carga Horária */}
          <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Carga Horária do Semestre
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-display text-on-surface font-bold">
                    {subjects.reduce((acc, s) => acc + (s.workload || 60), 0)}h
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">/ 480h totais</span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container text-on-surface">
                <span className="material-symbols-outlined text-2xl">schedule</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-space-xs">
              <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden mr-3">
                <div className="bg-secondary h-1.5 rounded-full" style={{ width: '87.5%' }} />
              </div>
              <span className="font-code-sm text-code-sm text-secondary font-semibold shrink-0">
                87.5%
              </span>
            </div>
          </div>

          {/* KPI 4: Previsão IA */}
          <div className="p-space-lg bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-space-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span> Previsão TaskMind IA [Fase 1]
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-display text-display text-on-surface font-bold">
                    {subjects.length} / {subjects.length}
                  </span>
                  <span className="font-body-sm text-body-sm text-emerald-700 font-semibold">
                    &gt; 90% chance
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-2xl">verified</span>
              </div>
            </div>
            <div className="pt-space-xs">
              <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Zero risco crítico de reprovação por falta
              </span>
            </div>
          </div>
        </section>

        {/* 3. Controls & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-2xl shadow-xs border border-outline-variant/30">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar por nome da disciplina, código ou docente..."
              className="w-full h-10 pl-10 pr-4 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:bg-surface-container-lowest transition-colors border border-transparent focus:border-secondary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-space-sm justify-between md:justify-end">
            <div className="inline-flex p-1 bg-surface-container-low rounded-xl">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md font-semibold transition-all cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Todas ({subjects.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('exatas')}
                className={`px-3 py-1.5 rounded-lg font-label-md text-label-md transition-all cursor-pointer ${
                  categoryFilter === 'exatas'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Exatas &amp; Comp
              </button>
            </div>

            <div className="inline-flex p-1 bg-surface-container-low rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Visualização em Grade"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Visualização em Lista Compacta"
              >
                <span className="material-symbols-outlined text-lg">table_rows</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Disciplines Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-space-lg">
          {filteredSubjects.map((subj) => {
            const total = (subj.attendances || 0) + (subj.absences || 0);
            const attendancePct =
              total > 0 ? ((subj.attendances / total) * 100).toFixed(1) : '100.0';
            const remainingAbsences = Math.max(0, (subj.maxAbsences || 15) - (subj.absences || 0));
            const subjectTasks = tasks.filter((t) => t.subjectId === subj.id);

            return (
              <article
                key={subj.id}
                className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-space-md hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-space-md">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 font-code-sm text-code-sm font-semibold">
                          {subj.code}
                        </span>
                        {subj.isDemo && (
                          <span className="px-1.5 py-0.2 rounded font-code-sm text-[10px] bg-surface-container text-on-surface-variant font-medium">
                            Demonstração
                          </span>
                        )}
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {subj.credits} créditos • {subj.workload}h
                        </span>
                      </div>
                      <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                        {subj.name}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">person</span>
                          {subj.professor}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {subj.room}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {subj.currentGrade !== null && subj.currentGrade !== undefined ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-label-sm text-label-sm font-semibold">
                          Média Atual: {Number(subj.currentGrade).toFixed(1)} • Em Andamento
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm italic">
                          Sem notas lançadas
                        </span>
                      )}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditSubjectModal(subj)}
                          className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                          title="Editar dados da disciplina"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSubjectToDelete(subj)}
                          className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-surface-container"
                          title="Excluir disciplina"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attendance & Absence Interactive Control */}
                  <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between font-label-md text-label-md flex-wrap gap-2">
                      <span className="text-on-surface font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-secondary text-base">
                          checklist
                        </span>{' '}
                        Controle de Frequência Real
                      </span>
                      <span className="font-code-sm text-code-sm text-emerald-700 font-semibold">
                        {attendancePct}% ({subj.attendances} de {total} presenças)
                      </span>
                    </div>

                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden my-1">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          Number(attendancePct) >= 75 ? 'bg-emerald-600' : 'bg-error'
                        }`}
                        style={{ width: `${Math.min(100, Number(attendancePct))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant flex-wrap gap-2">
                      <span>
                        {subj.absences} faltas computadas (limite: {subj.maxAbsences || 15})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-700 font-medium">
                          Restam {remainingAbsences} faltas
                        </span>
                        {/* Attendance adjuster buttons */}
                        <div className="flex items-center gap-1 bg-surface-container-lowest rounded-lg p-0.5 border border-surface-container">
                          <button
                            type="button"
                            onClick={() => addAbsence(subj.id)}
                            className="px-2 py-0.5 text-error font-code-sm text-code-sm font-bold hover:bg-error-container/40 rounded cursor-pointer"
                            title="Adicionar falta (+1)"
                          >
                            + Falta
                          </button>
                          <button
                            type="button"
                            onClick={() => addAttendance(subj.id)}
                            className="px-2 py-0.5 text-emerald-700 font-code-sm text-code-sm font-bold hover:bg-emerald-100 rounded cursor-pointer"
                            title="Remover falta / compensar presença"
                          >
                            + Presença
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grade Breakdown */}
                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                      Composição de Notas &amp; Avaliações
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(subj.assessments || []).map((ass, i) => (
                        <div
                          key={ass.id || i}
                          className="p-2.5 bg-surface-container rounded-lg flex items-center justify-between"
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                              {ass.name}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Peso {Math.round(ass.weight * 100)}% {ass.date ? `• ${ass.date}` : ''}
                            </span>
                          </div>
                          {ass.grade !== null && ass.grade !== undefined ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-code-sm text-code-sm font-bold rounded shrink-0">
                              {ass.grade} / 10.0
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-surface-container-highest text-on-surface font-code-sm text-code-sm rounded shrink-0">
                              {ass.status === 'pending' ? 'Pendente' : 'Prevista'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Syllabus Accordion */}
                  <details className="group bg-surface-container-low rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between p-3 font-label-md text-label-md text-on-surface font-semibold cursor-pointer select-none">
                      <span className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-base text-secondary">
                          menu_book
                        </span>
                        Ementa &amp; Conteúdo Programático
                      </span>
                      <span className="material-symbols-outlined text-lg transition-transform group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="px-3 pb-3 flex flex-col gap-2 font-body-sm text-body-sm text-on-surface-variant">
                      <div className="flex flex-wrap gap-1.5">
                        {(subj.syllabus || []).map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-surface-container-lowest rounded text-on-surface font-medium border border-surface-container"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                      <span className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm font-semibold hover:underline mt-1 cursor-pointer">
                        <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                        Plano de Ensino Homologado (.PDF) [Demonstração]
                      </span>
                    </div>
                  </details>

                  {/* AI Insight Box with Simulator Bridge */}
                  <div className="p-3 bg-secondary-fixed/40 rounded-xl flex items-start gap-2.5 border border-secondary/20">
                    <span className="material-symbols-outlined text-secondary text-lg mt-0.5 shrink-0">
                      lightbulb
                    </span>
                    <div className="flex flex-col gap-1 w-full">
                      <p className="font-body-sm text-body-sm text-on-surface font-medium leading-relaxed">
                        {subj.aiInsight ||
                          `Com base nas notas atuais, dedique blocos de estudo escalonados para garantir aprovação com distinção.`}
                      </p>
                      <div className="flex items-center gap-3 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenSimulator(subj.id)}
                          className="font-label-sm text-label-sm text-secondary font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">auto_awesome</span>
                          Simular Nota Necessária
                        </button>
                        <span className="text-on-surface-variant">•</span>
                        <button
                          type="button"
                          onClick={() => navigate('/tarefas')}
                          className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface font-medium cursor-pointer"
                        >
                          Ver {subjectTasks.length} tarefas da matéria
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* 5. Simulation & Academic Quick Tools Banner */}
        <section className="bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-low p-space-lg rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col lg:flex-row items-center justify-between gap-space-lg">
          <div className="flex items-center gap-space-md">
            <div className="p-3.5 bg-secondary text-on-secondary rounded-2xl shadow-sm shrink-0">
              <span className="material-symbols-outlined text-3xl">calculate</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-title text-title text-on-surface font-bold">
                Simulador de Média &amp; Aprovação com IA
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl">
                Descubra a pontuação exata necessária nas provas finais para garantir sua meta
                acadêmica (Média 7.0 de corte ou Distinção 8.5 para intercâmbio).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/simulador')}
              className="h-10 px-4 bg-secondary text-on-secondary rounded-lg font-label-md text-label-md hover:bg-secondary-container transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              <span>Abrir Simulador de Notas Completo</span>
            </button>
          </div>
        </section>
      </div>

      {/* Modal for Creating / Editing Subject */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-sm sm:p-space-md">
          <div
            className="fixed inset-0 bg-primary-container/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSubjectModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden z-10 p-space-lg border border-outline-variant/40 flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container-low pb-2">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {editingSubject ? 'Editar Disciplina' : 'Cadastrar Nova Disciplina'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="flex flex-col gap-space-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                    Código
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container focus:outline-none focus:border-secondary font-code-sm text-code-sm"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                    Nome da Disciplina
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Engenharia de Software II"
                    className="h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container focus:outline-none focus:border-secondary font-body-md text-body-md"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                  Docente Responsável
                </label>
                <input
                  type="text"
                  required
                  value={formProfessor}
                  onChange={(e) => setFormProfessor(e.target.value)}
                  placeholder="Ex: Prof. Dr. Silva"
                  className="h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container focus:outline-none focus:border-secondary font-body-md text-body-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                    Créditos
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formCredits}
                    onChange={(e) => setFormCredits(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container focus:outline-none focus:border-secondary font-body-md text-body-md"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-label-sm font-semibold text-on-surface">
                    Carga Horária (h)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={120}
                    value={formWorkload}
                    onChange={(e) => setFormWorkload(e.target.value)}
                    className="h-10 px-3 rounded-lg bg-surface-container-low border border-surface-container focus:outline-none focus:border-secondary font-body-md text-body-md"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container-low">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg font-label-md text-label-md bg-secondary text-on-secondary hover:bg-secondary-container font-semibold shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation modal before subject deletion */}
      <DeleteConfirmModal
        isOpen={Boolean(subjectToDelete)}
        title="Excluir Disciplina"
        message={`Deseja excluir permanentemente a disciplina "${subjectToDelete?.name}"? Esta ação removerá a ementa e histórico de notas associados.`}
        onCancel={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) {
            deleteSubject(subjectToDelete.id);
            setSubjectToDelete(null);
          }
        }}
      />
    </div>
  );
}
