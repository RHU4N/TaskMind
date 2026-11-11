/**
 * @file SimulatorPage.jsx
 * Screen 6: Simulador de Média e Aprovação com IA.
 * Interactive weighted average calculator with configurable passing thresholds,
 * real-time sliders, required grade projections, mathematical formula explanations,
 * and direct conversion of academic goals into tasks.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAcademic } from '../context/AcademicContext.jsx';
import { calculateSimulatorGrade } from '../utils/academicCalculations.js';

export default function SimulatorPage() {
  const {
    subjects,
    createTask,
    settings,
  } = useAcademic();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected subject
  const initialSubjId = searchParams.get('subjectId') || (subjects[0] ? subjects[0].id : '');
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubjId);

  // Performance target (7.0, 8.5, 9.0, or custom)
  const [targetType, setTargetType] = useState('8.5'); // '7.0', '8.5', '9.0', 'custom'
  const [customTarget, setCustomTarget] = useState(7.5);

  const targetAverage = useMemo(() => {
    if (targetType === '7.0') return 7.0;
    if (targetType === '8.5') return 8.5;
    if (targetType === '9.0') return 9.0;
    return Number(customTarget) || 7.0;
  }, [targetType, customTarget]);

  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || null;
  }, [subjects, selectedSubjectId]);

  // Assessments state for simulation
  const [simulatedAssessments, setSimulatedAssessments] = useState(() => {
    const subj = subjects.find((s) => s.id === initialSubjId) || subjects[0];
    return subj && subj.assessments
      ? subj.assessments.map((ass) => ({
          ...ass,
          simulatedGrade: ass.grade !== null && ass.grade !== undefined ? ass.grade : 6.5,
        }))
      : [];
  });

  // Load assessments whenever active subject changes
  useEffect(() => {
    if (activeSubject && activeSubject.assessments) {
      setSimulatedAssessments(
        activeSubject.assessments.map((ass) => ({
          ...ass,
          simulatedGrade: ass.grade !== null && ass.grade !== undefined ? ass.grade : 6.5,
        }))
      );
    }
  }, [activeSubject]);

  // Mathematical weighted average calculation from production module
  const calculationResult = useMemo(() => {
    return calculateSimulatorGrade({
      assessments: simulatedAssessments,
      targetAverage,
    });
  }, [simulatedAssessments, targetAverage]);

  const handleUpdateSimulatedGrade = (index, newGrade) => {
    setSimulatedAssessments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, simulatedGrade: Number(newGrade) } : item))
    );
  };

  const [notification, setNotification] = useState('');

  const handleCreateGoalTask = () => {
    if (!calculationResult.hasAssessments) return;
    createTask({
      title: `Meta de Estudos: Atingir ≥ ${calculationResult.requiredGradeForTarget} em ${activeSubject?.name}`,
      subjectId: activeSubject?.id,
      subjectName: activeSubject?.name,
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      priority: 'alta',
      estimatedTime: '3h 00m',
      description: `Meta estabelecida no Simulador IA para alcançar média ${targetAverage}. Dedicar 3 blocos de estudo nos tópicos prioritários.`,
      isAiPrioritized: true,
      hasAiBadge: true,
      aiBadgeText: 'Meta Simulador',
      subtasks: [
        { id: `st-m-1`, text: 'Revisar teoria das avaliações pendentes', completed: false },
        { id: `st-m-2`, text: 'Resolver 3 listas de exercícios de fixação', completed: false },
        { id: `st-m-3`, text: 'Simular prova no tempo limite cronometrado', completed: false },
      ],
    });

    setNotification(
      `Meta acadêmica criada com sucesso! Tarefa adicionada à sua grade e sincronizada com o calendário.`
    );
    setTimeout(() => setNotification(''), 4000);
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="w-full max-w-4xl mx-auto px-margin-mobile lg:px-gutter py-space-md lg:py-space-xl flex flex-col gap-space-lg">
        {/* Header Section */}
        <div className="p-space-lg bg-surface-container-lowest rounded-3xl shadow-xs border border-outline-variant/30 flex flex-col gap-space-md">
          <div className="flex items-start justify-between gap-space-md flex-wrap">
            <div className="flex items-center gap-3">
              <span className="p-3 rounded-2xl bg-secondary-fixed text-on-secondary-fixed shadow-xs">
                <span className="material-symbols-outlined text-2xl text-secondary">calculate</span>
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-md text-headline-md font-bold text-on-surface">
                    Simulador de Média &amp; Aprovação IA
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full font-code-sm text-code-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                    TaskMind IA
                  </span>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Calcule a nota necessária nas próximas avaliações e preveja seu IRA com inteligência artificial.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/disciplinas')}
              className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Voltar às Disciplinas</span>
            </button>
          </div>

          {notification && (
            <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl font-label-md text-label-md flex items-center gap-2 animate-in fade-in">
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
              <span>{notification}</span>
            </div>
          )}

          {/* Form Body */}
          <div className="flex flex-col gap-space-md">
            {/* Field 1: Disciplina Selecionada */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                <span>Disciplina Selecionada</span>
                <span className="font-code-sm text-code-sm font-semibold">
                  {activeSubject?.currentGrade !== null &&
                  activeSubject?.currentGrade !== undefined &&
                  activeSubject?.currentGrade !== '' ? (
                    <span className="text-emerald-700">
                      Média Atual: {Number(activeSubject.currentGrade).toFixed(1)} • Em Andamento
                    </span>
                  ) : (
                    <span className="text-on-surface-variant font-normal italic">
                      Sem notas lançadas • Em Andamento
                    </span>
                  )}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/50 cursor-pointer border border-transparent"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} • {s.name} ({s.professor})
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-xl">
                  unfold_more
                </span>
              </div>
            </div>

            {/* Field 2: Meta de Desempenho Desejada */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Meta de Desempenho Desejada (Corte)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs">
                {[
                  { key: '7.0', label: 'Aprovação (7.0)' },
                  { key: '8.5', label: 'Bolsa / Intercâmbio (8.5)' },
                  { key: '9.0', label: 'Láurea (9.0)' },
                  { key: 'custom', label: 'Personalizada' },
                ].map((item) => {
                  const isSelected = targetType === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTargetType(item.key)}
                      className={`p-2.5 rounded-xl font-label-md text-label-md transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-secondary-fixed text-on-secondary-fixed font-bold shadow-xs border-2 border-secondary'
                          : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {targetType === 'custom' && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-surface-container-low rounded-xl">
                  <span className="font-label-sm text-label-sm text-on-surface">Definir Nota de Corte:</span>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={customTarget}
                    onChange={(e) => setCustomTarget(e.target.value)}
                    className="w-24 px-2 py-1 bg-surface-container-lowest rounded-lg font-code-sm text-code-sm text-on-surface border border-surface-container"
                  />
                </div>
              )}
            </div>

            {/* Field 3: Composição e Simulação de Notas */}
            <div className="flex flex-col gap-2 p-space-md bg-surface-container-low rounded-2xl border border-surface-container">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                Composição e Simulação de Notas Interativas
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {!calculationResult.hasAssessments ? (
                  <div className="p-6 text-center flex flex-col items-center justify-center gap-2 bg-surface-container-lowest rounded-xl border border-surface-container-high sm:col-span-2">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">assignment_late</span>
                    <h4 className="font-label-md text-label-md font-bold text-on-surface">Nenhuma avaliação cadastrada</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md">
                      Esta disciplina não possui avaliações e pesos registrados. Para simular a média ponderada e a nota restante para aprovação, cadastre as provas e trabalhos.
                    </p>
                  </div>
                ) : (
                  simulatedAssessments.map((ass, idx) => {
                    const isCompleted = ass.grade !== null && ass.grade !== undefined;

                    if (isCompleted) {
                      return (
                        <div
                          key={ass.id || idx}
                          className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between border border-surface-container-high"
                        >
                          <div className="flex flex-col">
                            <span className="font-label-md text-label-md text-on-surface font-semibold">
                              {ass.name}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Peso {Math.round(ass.weight * 100)}% • Concluído
                            </span>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded font-code-sm text-code-sm font-bold">
                            {ass.grade} / 10.0
                          </span>
                        </div>
                      );
                    }

                    // Simulated upcoming evaluation with interactive slider
                    return (
                      <div
                        key={ass.id || idx}
                        className="p-3 bg-secondary-fixed/20 rounded-xl flex flex-col gap-2 border border-secondary/30 sm:col-span-2 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-label-md text-label-md text-on-surface font-bold">
                                {ass.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded font-code-sm text-code-sm bg-secondary text-on-secondary font-semibold">
                                Simulando
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Peso {Math.round(ass.weight * 100)}% {ass.date ? `• ${ass.date}` : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-headline-sm text-headline-sm font-bold text-secondary">
                              {ass.simulatedGrade?.toFixed(1) || '6.5'}
                            </span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">/ 10.0</span>
                          </div>
                        </div>

                        {/* Range slider */}
                        <div className="w-full flex items-center gap-3">
                          <span className="font-code-sm text-code-sm text-on-surface-variant">0.0</span>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={ass.simulatedGrade !== undefined ? ass.simulatedGrade : 6.5}
                            onChange={(e) => handleUpdateSimulatedGrade(idx, e.target.value)}
                            className="w-full accent-secondary cursor-pointer h-2 bg-surface-container-highest rounded-lg"
                          />
                          <span className="font-code-sm text-code-sm text-on-surface-variant">10.0</span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Dynamic Required Grade Target Card */}
                <div className="p-3 bg-surface-container-lowest rounded-xl flex items-center justify-between border border-surface-container-high sm:col-span-2">
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Nota Média Necessária nas Avaliações Restantes (p/ Meta {targetAverage})
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {calculationResult.hasAssessments
                        ? 'Calculado dinamicamente via fórmula de média ponderada'
                        : 'Indisponível: Sem avaliações registradas'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-headline-sm text-headline-sm font-bold ${
                        !calculationResult.hasAssessments
                          ? 'text-on-surface-variant'
                          : calculationResult.isPossible
                          ? 'text-secondary'
                          : 'text-error'
                      }`}
                    >
                      {calculationResult.hasAssessments
                        ? calculationResult.isPossible
                          ? `${calculationResult.requiredGradeForTarget} / 10.0`
                          : 'Impossível (>10)'
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 4: Projeção IA & Cenário Simulador */}
            {!calculationResult.hasAssessments ? (
              <div className="p-space-md bg-surface-container-low rounded-2xl flex flex-col gap-space-sm border border-surface-container">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">analytics</span>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                      Projeção IA &amp; Cenário Simulador
                    </span>
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      Aguardando Cadastro de Avaliações
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-xl text-on-surface-variant font-body-sm text-body-sm border border-surface-container">
                  A previsão de aprovação e o cálculo de nota restante exigem ao menos uma avaliação com peso atribuído no plano de ensino de <em>{activeSubject?.name}</em>.
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-xl text-on-surface-variant font-code-sm text-code-sm border border-surface-container flex flex-col gap-1">
                  <span className="font-semibold text-on-surface">Fórmulas Matemáticas do Simulador:</span>
                  <span>• Média Ponderada = Σ (Nota × Peso) / Σ Pesos</span>
                  <span>• Nota Necessária = (Meta × Σ Pesos - Pontos Obtidos) / Peso Restante</span>
                </div>
              </div>
            ) : (
              <div className="p-space-md bg-secondary-fixed/30 rounded-2xl flex flex-col gap-space-sm border border-secondary/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-2xl">auto_awesome</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                        Projeção IA &amp; Cenário Simulador
                      </span>
                      <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                        Média Final Projetada: {calculationResult.projectedAverage} / 10.0
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full font-label-sm text-label-sm font-bold ${
                      calculationResult.projectedAverage >= targetAverage
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {calculationResult.projectedAverage >= targetAverage
                      ? 'Aprovado com Folga'
                      : 'Atenção aos Prazos'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-secondary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (calculationResult.projectedAverage || 0) * 10)}%` }}
                  />
                </div>

                {/* AI Explanation card */}
                <div className="p-3 bg-surface-container-lowest rounded-xl flex items-start gap-2.5 shadow-xs border border-surface-container">
                  <span className="material-symbols-outlined text-secondary text-lg mt-0.5 shrink-0">
                    psychology
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                    Com uma nota de{' '}
                    <strong className="text-secondary font-bold">
                      {calculationResult.requiredGradeForTarget}
                    </strong>{' '}
                    nas avaliações pendentes de <em>{activeSubject?.name}</em>, você garante sua meta de{' '}
                    <strong>{targetAverage}</strong> com margem acadêmica segura.
                  </p>
                </div>

                {/* Mathematical Formula Explanation Box */}
                <div className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant font-code-sm text-code-sm flex flex-col gap-1 border border-surface-container">
                  <span className="font-semibold text-on-surface">
                    Explicação das Fórmulas Matemáticas:
                  </span>
                  <span>• Média Ponderada = Σ (Nota × Peso) / Σ Pesos</span>
                  <span>• Nota Necessária = (Meta × Σ Pesos - Pontos Obtidos) / Peso Restante</span>
                  <span>
                    • Pontos Obtidos: {calculationResult.completedPoints?.toFixed(2) ?? '0.00'} | Peso Pendente:{' '}
                    {Math.round(calculationResult.pendingWeight * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-secondary/20 text-on-surface-variant font-label-sm text-label-sm flex-wrap gap-2">
                  <span>
                    Nível de Esforço Recomendado:{' '}
                    <strong className="text-on-surface">Moderado (4h/sem)</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Risco de Reprovação:{' '}
                    <strong className="text-emerald-700">Baixo (&lt; 4%)</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="pt-space-sm flex items-center justify-between gap-space-sm flex-wrap border-t border-surface-container-low">
              <button
                type="button"
                onClick={() => {
                  if (activeSubject && activeSubject.assessments) {
                    setSimulatedAssessments(
                      activeSubject.assessments.map((ass) => ({
                        ...ass,
                        simulatedGrade: ass.grade !== null ? ass.grade : 6.5,
                      }))
                    );
                  }
                }}
                className="font-label-md text-label-md text-on-surface-variant hover:text-secondary transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">cached</span>
                <span>Redefinir Simulação</span>
              </button>

              <button
                type="button"
                disabled={!calculationResult.hasAssessments}
                onClick={handleCreateGoalTask}
                className={`px-6 py-2.5 rounded-xl font-label-md text-label-md font-semibold shadow-md transition-all flex items-center gap-2 ${
                  calculationResult.hasAssessments
                    ? 'bg-secondary text-on-secondary hover:bg-secondary-container hover:scale-[1.02] cursor-pointer'
                    : 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed'
                }`}
                title={calculationResult.hasAssessments ? 'Criar meta no calendário' : 'Requer avaliações cadastradas'}
              >
                <span className="material-symbols-outlined text-lg">event_available</span>
                <span>Criar Meta no Calendário</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
