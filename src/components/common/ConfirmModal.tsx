import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top subtle highlight */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${variant === 'danger' ? 'bg-rose-500' : variant === 'warning' ? 'bg-amber-500' : 'bg-brand-500'}`} />

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${
              variant === 'danger' ? 'bg-rose-500/10 text-rose-400' :
              variant === 'warning' ? 'bg-amber-500/10 text-amber-400' :
              'bg-brand-500/10 text-brand-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-300 leading-relaxed">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-xl text-white transition shadow-lg ${
              variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50' :
              variant === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50' :
              'bg-brand-600 hover:bg-brand-500 shadow-brand-950/50'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
