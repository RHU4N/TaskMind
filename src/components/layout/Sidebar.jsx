/**
 * @file Sidebar.jsx
 * Reusable navigation dock conforming to Google Stitch DESIGN.md.
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAcademic } from '../../context/AcademicContext.jsx';

export default function Sidebar({ isOpen, onClose }) {
  const { metrics, settings } = useAcademic();
  const location = useLocation();

  const navItems = [
    {
      to: '/',
      label: 'Visão Geral',
      icon: 'dashboard',
    },
    {
      to: '/tarefas',
      label: 'Minhas Tarefas',
      icon: 'check_circle',
      badge: metrics.pendingCount,
    },
    {
      to: '/assistente',
      label: 'Assistente IA',
      icon: 'auto_awesome',
      iconColor: 'text-secondary',
      tag: 'Pro/IA',
    },
    {
      to: '/disciplinas',
      label: 'Disciplinas',
      icon: 'menu_book',
    },
    {
      to: '/calendario',
      label: 'Calendário',
      icon: 'calendar_today',
    },
    {
      to: '/simulador',
      label: 'Simulador de Média',
      icon: 'calculate',
      tag: 'IA',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between transition-transform duration-200 border-r border-outline-variant/30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Header & Logo */}
          <div className="h-16 px-space-md flex items-center justify-between gap-space-sm border-b border-surface-container-low">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary font-bold shadow-xs">
                <span className="material-symbols-outlined text-secondary text-xl">psychology</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title text-title text-on-surface leading-tight font-bold">
                  TaskMind
                </span>
                <span className="font-code-sm text-code-sm text-secondary font-semibold tracking-wide uppercase">
                  Acadêmico IA
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          {/* Section Label */}
          <div className="px-space-md py-space-sm">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Menu Principal
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-space-xs px-space-sm">
            {navItems.map((item) => {
              const isActive =
                item.to === '/'
                  ? location.pathname === '/' || location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center justify-between px-space-md py-2.5 rounded-lg transition-colors font-label-md text-label-md ${
                    isActive
                      ? 'bg-surface-container text-on-surface font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span
                      className={`material-symbols-outlined text-xl ${
                        item.iconColor || (isActive ? 'text-secondary' : 'text-on-surface-variant')
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded font-code-sm text-code-sm bg-surface-container text-on-surface-variant font-semibold">
                      {item.badge}
                    </span>
                  )}

                  {item.tag && (
                    <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed font-semibold">
                      {item.tag}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Area: Progress & User info */}
        <div className="p-space-md flex flex-col gap-space-sm border-t border-surface-container-low">
          {/* Semester Progress Card */}
          <div className="p-space-md bg-surface-container-low rounded-xl flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                Semestre {settings.user.semester}
              </span>
              <span className="font-code-sm text-code-sm text-secondary font-semibold">
                {settings.user.semesterProgressPercent}%
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-secondary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${settings.user.semesterProgressPercent}%` }}
              />
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Faltam {settings.user.daysRemaining} dias para o término do período letivo.
            </p>
          </div>

          {/* User Profile info */}
          <div className="flex items-center gap-space-sm pt-space-xs">
            <img
              alt={`Perfil de ${settings.user.name || 'estudante'}`}
              className="w-8 h-8 rounded-full object-cover shadow-xs ring-1 ring-secondary/30"
              src={settings.user.avatar || '/assets/avatar-placeholder.svg'}
            />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                {settings.user.name}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                {settings.user.course}
              </span>
            </div>
            <span
              className="w-2.5 h-2.5 rounded-full bg-secondary"
              title="Status Ativo: Discente Regular"
            />
          </div>
        </div>
      </aside>
    </>
  );
}
