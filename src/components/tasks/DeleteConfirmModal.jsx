/**
 * @file DeleteConfirmModal.jsx
 * Confirmation modal before permanently deleting an academic task or subject.
 */

import React from 'react';

export default function DeleteConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-space-sm sm:p-space-md">
      <div
        className="fixed inset-0 bg-primary-container/60 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden z-10 p-space-lg flex flex-col gap-space-md border border-outline-variant/40 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-space-sm text-error">
          <div className="w-10 h-10 rounded-xl bg-error-container/60 flex items-center justify-center text-error">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <div className="flex flex-col">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
              {title || 'Confirmar Exclusão'}
            </h3>
            <span className="font-code-sm text-code-sm text-error font-semibold">
              Ação irreversível
            </span>
          </div>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {message || 'Tem certeza de que deseja excluir este item? Essa ação não pode ser desfeita.'}
        </p>

        <div className="flex items-center justify-end gap-space-sm pt-space-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-label-md text-label-md bg-error text-on-error hover:bg-red-700 transition-colors font-semibold shadow-xs"
          >
            Excluir Definitivamente
          </button>
        </div>
      </div>
    </div>
  );
}
