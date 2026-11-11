/**
 * @file Header.jsx
 * Top navigation header with global search, task creation trigger and notification flyout.
 */

import React, { useState } from 'react';
import { useAcademic } from '../../context/AcademicContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header({ onMenuClick }) {
  const { signOut, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const {
    globalSearch,
    setGlobalSearch,
    setIsTaskModalOpen,
    setEditingTask,
    metrics,
    settings,
  } = useAcademic();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifications = metrics.sortedUpcoming.slice(0, 3);

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-40 bg-surface/85 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-space-md lg:px-gutter flex items-center justify-between gap-space-md">
        {/* Mobile menu button & Search Input */}
        <div className="flex items-center gap-space-sm flex-1 max-w-xl">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Buscar tarefas, disciplinas, resumos... (Ctrl + K)"
              className="w-full h-10 pl-10 pr-4 bg-surface-container-lowest rounded-lg font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all border border-surface-container-high shadow-xs"
            />
          </div>
        </div>

        {/* Action Controls & User Snippet */}
        <div className="flex items-center gap-space-sm">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleOpenNewTask}
            className="inline-flex items-center gap-space-xs h-10 px-4 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              aria-label="Notificações de prazos acadêmicos"
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              {notifications.length > 0 && (metrics.overdueCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-on-error font-code-sm text-code-sm font-bold">
                  {Math.min(9, metrics.overdueCount)}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-on-secondary font-code-sm text-code-sm font-bold">
                  {Math.min(9, notifications.length)}
                </span>
              ))}
            </button>

            {/* Notifications Dropdown Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 p-space-md z-50 flex flex-col gap-space-sm animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
                  <span className="font-title text-title text-on-surface font-bold">
                    Notificações de Prazos
                  </span>
                  <span className="font-code-sm text-code-sm text-secondary font-semibold">
                    {settings.user.semester || 'Período atual'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? <p className="p-3 text-on-surface-variant">Nenhum prazo pendente.</p> : notifications.map((task) => {
                    const overdue = task.dueDate && new Date(task.dueDate) < new Date();
                    return <div key={task.id} className={`p-2.5 rounded-xl flex items-start gap-2.5 ${overdue ? 'bg-error-container/40' : 'bg-surface-container-low'}`}><span className={`material-symbols-outlined text-xl ${overdue ? 'text-error' : 'text-secondary'}`}>{overdue ? 'warning' : 'event'}</span><div className="flex flex-col"><span className="font-label-md text-label-md font-semibold text-on-surface">{task.title}</span><span className="font-body-sm text-body-sm text-on-surface-variant">{task.dueDate ? new Date(task.dueDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'Sem prazo'}</span></div></div>;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="w-full py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm font-semibold transition-colors text-center"
                >
                  Fechar notificações
                </button>
              </div>
            )}
          </div>

          {/* User Avatar Snippet */}
          <div className="hidden sm:flex items-center gap-space-xs pl-space-xs">
            <img
              alt="Avatar do usuário"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-secondary/30"
              src={settings.user.avatar || '/assets/avatar-placeholder.svg'}
            />
            <div className="hidden xl:flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface font-semibold leading-tight">
                {settings.user.name}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant leading-tight truncate max-w-[160px]">
                {settings.user.course || user?.email || 'Conta conectada'}
              </span>
            </div>
          </div>
          <button
            type="button"
            disabled={isSigningOut}
            onClick={async () => {
              setIsSigningOut(true);
              try { await signOut(); } finally { setIsSigningOut(false); }
            }}
            title="Sair da conta"
            aria-label="Sair da conta"
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="hidden md:inline font-label-sm text-label-sm">
              {isSigningOut ? 'Saindo…' : 'Sair'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
