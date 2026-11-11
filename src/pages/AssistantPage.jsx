/**
 * @file AssistantPage.jsx
 * Screen 3: Assistente IA Acadêmico — TaskMind Agent Interface.
 * Implements the chat stream, suggestion chips, interactive action plan,
 * human-in-the-loop tool validation, and clear Phase 1 architectural status.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext.jsx';
import { AGENT_CONFIG } from '../services/agentService.js';

export default function AssistantPage() {
  const {
    chatMessages,
    sendUserMessage,
    executeProposedAction,
    clearChat,
    actionPlan,
    toggleActionPlanStep,
    saveActionPlan,
    settings,
    subjects,
  } = useAcademic();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatStreamRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
  }, [chatMessages, isSending]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isSending) return;

    const text = inputPrompt;
    setInputPrompt('');
    setIsSending(true);
    try {
      await sendUserMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleInsertPrompt = (promptText) => {
    setInputPrompt(promptText);
  };

  return (
    <div className="flex flex-col w-full relative">
      <div className="p-margin-mobile lg:p-margin flex flex-col gap-space-lg max-w-[1600px] mx-auto w-full">
        {/* Top Context & Mode Indicator Bar */}
        <div className="flex flex-wrap items-center justify-between gap-space-md bg-surface-container-lowest p-space-md rounded-xl shadow-xs border border-outline-variant/30">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
              <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
              {AGENT_CONFIG.version}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-code-sm text-code-sm">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              Contexto Ativo: {subjects.length} disciplina(s) sincronizada(s)
            </span>
              <span className="hidden md:inline-flex text-on-surface-variant font-body-sm text-body-sm">
              {settings.user.semester ? `Semestre Letivo ${settings.user.semester}` : 'Semestre atual'}
              {settings.user.institution || settings.user.course
                ? ` • ${[settings.user.institution, settings.user.course].filter(Boolean).join(' / ')}`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-space-xs">
            <button
              type="button"
              onClick={clearChat}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
              title="Limpar histórico da sessão"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
              <span className="hidden sm:inline">Nova Sessão</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const text = JSON.stringify(actionPlan, null, 2);
                const blob = new Blob([text], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'plano_estudo_taskmind.json';
                a.click();
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
              title="Exportar plano de estudo"
            >
              <span className="material-symbols-outlined text-base">ios_share</span>
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Agent Architecture Status Banner */}
        <div className="p-space-md rounded-2xl bg-secondary-fixed/20 border border-secondary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-md">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-2xl mt-0.5">
              precision_manufacturing
            </span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Fluxo de agente Gemini com validação humana
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant max-w-4xl">
                O backend autentica a sessão, consulta somente dados autorizados por RLS e executa leituras.
                Toda criação, edição ou exclusão é persistida como proposta e só é executada após sua confirmação.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full font-code-sm text-code-sm bg-surface-container text-on-surface-variant whitespace-nowrap font-semibold">
            Status: API protegida
          </span>
        </div>

        {/* Main Workspace Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
          {/* Left Column: Conversational AI Canvas (7 cols on desktop) */}
          <section className="lg:col-span-7 flex flex-col bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/30 overflow-hidden min-h-[720px] justify-between">
            {/* Chat Header */}
            <div className="p-space-lg bg-surface-container-low/60 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md border-b border-surface-container">
              <div className="flex items-start gap-space-sm">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-on-secondary shadow-md shrink-0">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Assistente Acadêmico TaskMind
                    </h1>
                    <span className="px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed font-code-sm text-code-sm font-semibold tracking-tight">
                      Otimizado para Universitários
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Online ⚡</span>
                    <span className="text-outline-variant">•</span>
                    <span>Conectado a {subjects.length} disciplina(s) e ao calendário acadêmico</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors cursor-pointer"
                  title="Configurações do Agente"
                >
                  <span className="material-symbols-outlined text-xl">tune</span>
                </button>
              </div>
            </div>

            {/* Message History Stream */}
            <div
              ref={chatStreamRef}
              className="p-space-lg flex flex-col gap-space-lg overflow-y-auto max-h-[500px] overscroll-contain"
              id="chat-stream"
            >
              <div className="flex items-center justify-center gap-space-sm">
                <span className="h-px bg-surface-container-high flex-1" />
                <span className="font-code-sm text-code-sm text-on-surface-variant uppercase tracking-wider px-2">
                  Hoje • Sessão Acadêmica Ativa
                </span>
                <span className="h-px bg-surface-container-high flex-1" />
              </div>

              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-space-sm ${
                      isUser ? 'justify-end pl-8' : 'pr-6'
                    }`}
                  >
                    {!isUser && (
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-md shrink-0 mt-5">
                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                      </div>
                    )}

                    <div
                      className={`flex flex-col gap-1 max-w-[85%] ${
                        isUser ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className={`font-label-sm text-label-sm font-semibold ${
                            isUser ? 'text-on-surface-variant' : 'text-secondary'
                          }`}
                        >
                          {msg.authorName || (isUser ? settings.user.name || 'Você' : 'TaskMind AI')}
                        </span>
                        <span className="font-code-sm text-code-sm text-on-surface-variant">
                          {msg.timestamp}
                        </span>
                        {!isUser && (
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-code-sm text-[10px] font-semibold">
                            TaskMind Agent
                          </span>
                        )}
                        {msg.badge && (
                          <span className="px-2 py-0.2 rounded-full bg-secondary-fixed text-on-secondary-fixed font-code-sm text-code-sm">
                            {msg.badge}
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-space-md rounded-2xl font-body-md text-body-md leading-relaxed shadow-xs ${
                          isUser
                            ? 'rounded-tr-none bg-primary text-on-primary'
                            : 'rounded-tl-none bg-surface-container-low text-on-surface'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Highlight Box if present */}
                        {msg.highlightBox && (
                          <div className="mt-3 p-space-sm bg-surface-container-lowest rounded-xl flex items-center justify-between gap-space-sm shadow-xs border border-surface-container">
                            <div className="flex items-center gap-space-xs">
                              <span className="material-symbols-outlined text-secondary text-xl">
                                insights
                              </span>
                              <span className="font-label-md text-label-md font-semibold text-on-surface">
                                {msg.highlightBox.title}
                              </span>
                            </div>
                            <span className="font-code-sm text-code-sm text-secondary font-bold">
                              {msg.highlightBox.meta}
                            </span>
                          </div>
                        )}

                        {/* Proposed Tool Action (Human-In-The-Loop Confirmation) */}
                        {msg.toolProposal && (
                          <div className="mt-4 p-space-md bg-surface-container-lowest rounded-xl border-2 border-secondary/40 shadow-xs flex flex-col gap-space-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-secondary font-label-md text-label-md font-bold">
                                <span className="material-symbols-outlined text-lg">build_circle</span>
                                <span>Operação Proposta pelo Agente</span>
                              </div>
                              <span className="px-2 py-0.5 rounded font-code-sm text-code-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                                {msg.toolProposal.name}
                              </span>
                            </div>

                            <p className="font-title text-title font-semibold text-on-surface">
                              {msg.toolProposal.label}
                            </p>

                            {/* Tool Parameters Breakdown */}
                            <div className="p-2.5 rounded-lg bg-surface-container-low font-code-sm text-code-sm text-on-surface-variant flex flex-col gap-1">
                              {Object.entries(msg.toolProposal.params || {}).map(([k, v]) => (
                                <div key={k} className="flex items-baseline gap-1">
                                  <span className="font-semibold text-on-surface">{k}:</span>
                                  <span className="truncate">
                                    {Array.isArray(v) ? v.join(', ') : typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between gap-space-sm pt-1">
                              {msg.toolProposal.executed ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-800 font-label-sm text-label-sm font-semibold border border-emerald-500/30">
                                  <span className="material-symbols-outlined text-sm text-emerald-600">task_alt</span>
                                  <span>Operação Executada</span>
                                </span>
                              ) : (
                                <span className="font-code-sm text-code-sm text-on-surface-variant italic">
                                  Aguardando confirmação
                                </span>
                              )}

                              <button
                                type="button"
                                disabled={Boolean(msg.toolProposal.executed || msg.toolProposal.confirming)}
                                onClick={() => executeProposedAction(msg.toolProposal, msg.id)}
                                className={`px-4 py-2 rounded-lg font-label-md text-label-md font-semibold shadow-xs flex items-center gap-1.5 transition-all ${
                                  msg.toolProposal.executed || msg.toolProposal.confirming
                                    ? 'bg-surface-container-high text-on-surface-variant opacity-60 cursor-not-allowed'
                                    : 'bg-secondary text-on-secondary hover:bg-secondary-container cursor-pointer active:scale-95'
                                }`}
                                title={msg.toolProposal.executed ? 'Esta ação já foi executada' : 'Confirmar e registrar'}
                              >
                                <span className="material-symbols-outlined text-base">
                                  {msg.toolProposal.executed ? 'check' : 'check_circle'}
                                </span>
                                <span>{msg.toolProposal.executed ? 'Executado' : msg.toolProposal.confirming ? 'Executando…' : 'Confirmar e Executar'}</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Notice for transparency */}
                        {msg.notice && (
                          <span className="block mt-2 font-code-sm text-code-sm text-on-surface-variant/80 italic">
                            ⓘ {msg.notice}
                          </span>
                        )}
                      </div>

                      {/* Context Factors */}
                      {msg.contextFactors && msg.contextFactors.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="font-code-sm text-code-sm text-on-surface-variant">
                            Fatores considerados:
                          </span>
                          {msg.contextFactors.map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-on-surface font-code-sm text-code-sm"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${f.color || 'bg-secondary'}`} />
                              {f.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <img
                        className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs mt-5 ring-1 ring-secondary/30"
                        alt={msg.authorName}
                        src={settings.user.avatar || '/assets/avatar-placeholder.svg'}
                      />
                    )}
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-start gap-space-sm pr-6">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-md shrink-0 mt-1 animate-pulse">
                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  </div>
                  <div className="p-space-md rounded-2xl rounded-tl-none bg-surface-container-low text-on-surface-variant font-body-md text-body-md flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-bounce" />
                    <span>TaskMind AI está analisando seus dados acadêmicos…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips & Interactive Input Area */}
            <div className="p-space-md lg:p-space-lg bg-surface-container-lowest flex flex-col gap-space-sm border-t border-surface-container">
              {/* Chips / Suggested Actions */}
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1.5 scrollbar-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap pl-1 pr-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-secondary">flash_on</span>
                  Sugestões:
                </span>

                {[
                  'Quais são minhas tarefas pendentes e atrasadas?',
                  'Faça um resumo das minhas disciplinas e frequência',
                  'Criar tarefa: Revisar conteúdo para a próxima prova',
                  'Monte um plano de estudo com 3 horas disponíveis',
                ].map((promptText, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleInsertPrompt(promptText)}
                    className="whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-secondary-fixed hover:text-on-secondary-fixed text-on-surface font-label-md text-label-md transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    <span>{promptText}</span>
                  </button>
                ))}
              </div>

              {/* Chat Input Control Container */}
              <form
                onSubmit={handleSend}
                className="relative bg-surface-container-low rounded-xl p-space-xs transition-all focus-within:ring-2 focus-within:ring-secondary/40 shadow-xs border border-surface-container-high"
              >
                <textarea
                  rows={2}
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Faça uma pergunta acadêmica, cole o enunciado de um trabalho ou peça para o agente organizar suas matérias..."
                  className="w-full bg-transparent px-space-sm pt-space-xs font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none resize-none"
                />

                <div className="flex items-center justify-between pt-space-xs px-space-xs">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled
                      className="p-2 rounded-lg text-on-surface-variant/50 cursor-not-allowed transition-colors"
                      title="Anexar arquivo / PDF (Não conectado na Fase 1 — Disponível na Fase 2)"
                    >
                      <span className="material-symbols-outlined text-xl">attach_file</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="p-2 rounded-lg text-on-surface-variant/50 cursor-not-allowed transition-colors"
                      title="Comando por voz (Não conectado na Fase 1 — Disponível na Fase 2)"
                    >
                      <span className="material-symbols-outlined text-xl">mic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertPrompt('Sincronizar agenda e prazos')}
                      className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-on-surface-variant hover:bg-surface-container font-code-sm text-code-sm transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">schedule</span> Sincronizar Agenda
                    </button>
                  </div>

                  <div className="flex items-center gap-space-xs">
                    <span className="hidden md:inline font-code-sm text-code-sm text-on-surface-variant mr-1">
                      Enter para enviar • Shift + Enter para quebra
                    </span>
                    <button
                      type="submit"
                      disabled={isSending || !inputPrompt.trim()}
                      className="inline-flex items-center gap-2 h-10 px-5 bg-secondary hover:bg-secondary-container text-on-secondary rounded-lg font-label-md text-label-md font-semibold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{isSending ? 'Processando...' : 'Enviar'}</span>
                      <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>

          {/* Right Column: Interactive Generated Action Plan (5 cols on desktop) */}
          <aside className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Live Task Plan Card */}
            <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-xs border border-outline-variant/30 flex flex-col gap-space-md relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-secondary-fixed/50 blur-3xl pointer-events-none" />

              {/* Header & Impact Metric */}
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-code-sm text-code-sm font-semibold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span> Plano de estudo
                  </span>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">
                    {actionPlan.steps.length ? 'Estruturado' : 'Aguardando geração'}
                  </span>
                </div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-1">
                  {actionPlan.title}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {actionPlan.description}
                </p>
                <button type="button" onClick={saveActionPlan} className="self-start px-3 py-1.5 rounded-lg bg-primary text-on-primary text-sm font-semibold">Salvar plano</button>
              </div>

              {/* Stats / Metas Bar */}
              <div className="grid grid-cols-3 gap-space-xs p-space-sm bg-surface-container-low rounded-xl">
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <span className="font-title text-title text-on-surface font-bold">
                    {actionPlan.steps.length}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Etapas</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 text-center bg-surface-container-lowest rounded-lg shadow-xs">
                  <span className="font-title text-title text-secondary font-bold">
                    {actionPlan.stats.totalTime}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Tempo Total</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 text-center">
                  <span className="font-title text-title text-emerald-600 font-bold">
                    {actionPlan.stats.efficiency}
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Rendimento</span>
                </div>
              </div>

              {/* Structured Action Tasks */}
              <div className="flex flex-col gap-space-sm" id="task-plan-list">
                {actionPlan.steps.map((step) => (
                  <div
                    key={step.id}
                    className="p-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-all shadow-xs flex items-start gap-space-sm group border border-surface-container"
                  >
                    <input
                      type="checkbox"
                      id={`step-${step.id}`}
                      checked={Boolean(step.completed)}
                      onChange={() => toggleActionPlanStep(step.id)}
                      className="mt-1 w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-space-xs flex-wrap">
                        <span
                          className={`font-label-sm text-label-sm uppercase tracking-wider font-semibold ${
                            step.completed ? 'text-on-surface-variant' : 'text-secondary'
                          }`}
                        >
                          {step.period}
                        </span>
                        <span className="inline-flex items-center gap-1 font-code-sm text-code-sm bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                          <span className="material-symbols-outlined text-xs">timer</span>{' '}
                          {step.duration}
                        </span>
                      </div>

                      <label
                        htmlFor={`step-${step.id}`}
                        className={`font-title text-title font-semibold mt-0.5 cursor-pointer line-clamp-1 group-hover:text-secondary transition-colors ${
                          step.completed ? 'line-through text-on-surface-variant opacity-70' : 'text-on-surface'
                        }`}
                      >
                        {step.title}
                      </label>

                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        {step.description}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-label-sm text-label-sm">
                          {step.subject}
                        </span>
                        <span className="font-code-sm text-code-sm text-on-surface-variant">
                          {step.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
