/**
 * @file TaskModal.jsx
 * Faithfully ports the Stitch Task Creation & Edit Modal.
 * Includes interactive checklist with decomposed subtasks, priorities, validation and attachments.
 */

import React, { useState, useEffect } from 'react';
import { useAcademic } from '../../context/AcademicContext.jsx';

export default function TaskModal() {
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    subjects,
    createTask,
    updateTask,
  } = useAcademic();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('alta');
  const [description, setDescription] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [validationError, setValidationError] = useState('');

  // Pre-fill fields on open / edit
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setSubjectId(editingTask.subjectId || (subjects[0] ? subjects[0].id : ''));
      setDueDate(
        editingTask.dueDate ? editingTask.dueDate.slice(0, 16) : ''
      );
      setPriority(editingTask.priority || 'alta');
      setDescription(editingTask.description || '');
      setSubtasks(editingTask.subtasks ? [...editingTask.subtasks] : []);
    } else {
      setTitle('');
      setSubjectId(subjects[0] ? subjects[0].id : '');
      setDueDate('');
      setPriority('media');
      setDescription('');
      setSubtasks([]);
    }
    setValidationError('');
  }, [editingTask, isTaskModalOpen, subjects]);

  if (!isTaskModalOpen) return null;

  const handleClose = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleToggleSubtask = (index) => {
    setSubtasks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}`,
        text: `${prev.length + 1}. ${newSubtaskText.trim()}`,
        completed: false,
      },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('Por favor, informe o título da tarefa acadêmica.');
      return;
    }

    const selectedSubject = subjects.find((s) => s.id === subjectId) || subjects[0];
    const taskPayload = {
      title: title.trim(),
      subjectId: selectedSubject ? selectedSubject.id : '',
      subjectName: selectedSubject ? selectedSubject.name : 'Geral',
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      priority,
      description: description.trim(),
      subtasks,
      isAiPrioritized: priority === 'alta' || priority === 'urgente',
      hasAiBadge: Boolean(editingTask?.hasAiBadge),
      aiBadgeText: editingTask?.aiBadgeText || '',
    };

    if (editingTask) {
      updateTask(editingTask.id, taskPayload);
    } else {
      createTask(taskPayload);
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-sm sm:p-space-md lg:p-gutter overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary-container/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-3xl shadow-2xl overflow-hidden z-10 my-auto animate-in fade-in zoom-in-95 duration-200 border border-outline-variant/30">
        {/* Accent Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-secondary to-secondary-container" />

        {/* Modal Header */}
        <div className="px-space-lg pt-space-lg pb-space-sm flex items-start justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-secondary-fixed text-on-secondary-fixed">
                <span className="material-symbols-outlined text-xl">post_add</span>
              </span>
              <h2 className="font-headline-md text-headline-md font-bold text-on-surface">
                {editingTask ? 'Editar Tarefa Acadêmica' : 'Criar Nova Tarefa Acadêmica'}
              </h2>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Adicione os detalhes da entrega ou deixe a IA estruturar para você.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar janela"
            className="p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-space-lg py-space-sm flex flex-col gap-space-md max-h-[78vh] overflow-y-auto">
          {validationError && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl font-label-md text-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{validationError}</span>
            </div>
          )}

          {/* Campo 1: Título da Tarefa */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
              <span>
                Título da Tarefa <span className="text-error">*</span>
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                {title.length}/100
              </span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Implementar Algoritmo A* com Heurística Euclidiana..."
              className="w-full h-11 px-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/50 font-medium border border-transparent focus:border-secondary"
            />
          </div>

          {/* Grid 2 Colunas: Disciplina e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
            {/* Disciplina */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                Disciplina Vinculada <span className="text-error">*</span>
              </label>
              <div className="relative">
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full h-11 pl-4 pr-10 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface appearance-none focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/50 cursor-pointer border border-transparent focus:border-secondary"
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

            {/* Prazo */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md font-semibold text-on-surface flex items-center justify-between">
                <span>Prazo de Entrega <span className="font-normal text-on-surface-variant text-xs">(Opcional)</span></span>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="text-xs text-error hover:underline cursor-pointer font-normal"
                  >
                    Limpar prazo
                  </button>
                )}
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
                  calendar_clock
                </span>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full h-11 pl-11 pr-4 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/50 font-medium border border-transparent focus:border-secondary"
                />
              </div>
            </div>
          </div>

          {/* Campo 3: Prioridade */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface">
              Grau de Prioridade Acadêmica
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-xs">
              {[
                { key: 'urgente', label: 'Urgente', dotColor: 'bg-error' },
                { key: 'alta', label: 'Alta', dotColor: 'bg-error' },
                { key: 'media', label: 'Média', dotColor: 'bg-secondary-container' },
                { key: 'baixa', label: 'Baixa', dotColor: 'bg-outline' },
              ].map((p) => {
                const isSelected = priority === p.key;
                return (
                  <label
                    key={p.key}
                    onClick={() => setPriority(p.key)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all text-on-surface font-label-md text-label-md ${
                      isSelected
                        ? p.key === 'urgente' || p.key === 'alta'
                          ? 'bg-error-container text-on-error-container font-semibold shadow-xs ring-1 ring-error/50'
                          : 'bg-secondary-fixed text-on-secondary-fixed font-semibold shadow-xs ring-1 ring-secondary/50'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.key}
                      checked={isSelected}
                      onChange={() => setPriority(p.key)}
                      className="sr-only"
                    />
                    <span className={`w-2.5 h-2.5 rounded-full ${p.dotColor}`} />
                    <span>{p.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Campo 4: Instruções / Descrição */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md font-semibold text-on-surface">
              Instruções e Rubrica da Atividade
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anotações sobre a entrega, critérios de correção ou requisitos de submissão..."
              className="w-full p-3 bg-surface-container-low rounded-xl font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/50 resize-none border border-transparent focus:border-secondary"
            />
          </div>

          {/* Módulo Checklist Estruturado */}
          <div className="p-space-md bg-secondary-fixed/30 rounded-2xl flex flex-col gap-space-sm border border-secondary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">checklist</span>
                <span className="font-title text-title font-bold text-on-surface">
                  Checklist da tarefa
                </span>
              </div>
            </div>

            {/* Subtasks List */}
            <div className="flex flex-col gap-2">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded-xl shadow-xs group"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(st.completed)}
                    onChange={() => handleToggleSubtask(idx)}
                    className="w-4 h-4 rounded text-secondary accent-secondary cursor-pointer"
                  />
                  <span
                    className={`font-body-md text-body-md flex-1 ${
                      st.completed ? 'line-through text-on-surface-variant opacity-70' : 'text-on-surface'
                    }`}
                  >
                    {st.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(idx)}
                    className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Remover subtarefa"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ))}

              {/* Add Subtask Input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtask(e);
                    }
                  }}
                  placeholder="+ Adicionar etapa ao checklist..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface focus:outline-none border border-surface-container-high focus:border-secondary"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-sm text-label-sm transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          {/* Anexos dependem de um serviço de armazenamento ainda não configurado. */}
          <div className="flex items-center gap-space-sm p-3 bg-surface-container-low rounded-xl">
            <div className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant">
              <span className="material-symbols-outlined text-xl">attach_file</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                Anexos de arquivos
              </span>
              <span className="font-code-sm text-code-sm text-on-surface-variant">
                Recurso indisponível até a configuração de armazenamento seguro.
              </span>
            </div>
            <span className="px-2 py-0.5 rounded font-code-sm text-code-sm bg-surface-container-high text-on-surface-variant font-semibold">
              Indisponível
            </span>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-space-md border-t border-surface-container-low flex items-center justify-between gap-space-sm">
            <button
              type="button"
              onClick={handleClose}
              className="font-label-md text-label-md text-on-surface-variant hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">delete_sweep</span>
              <span>Descartar</span>
            </button>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-label-md text-label-md bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              >
                {editingTask ? 'Salvar Alterações' : 'Salvar Tarefa'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
