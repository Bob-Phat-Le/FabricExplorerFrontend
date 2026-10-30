'use client';

import { cn } from '@/lib/cn';
import type { ToastItem, ToastType } from '@/providers/ToastProvider';

const STYLES: Record<ToastType, { box: string; icon: string }> = {
  info: {
    box: 'border-slate-200',
    icon: 'fa-solid fa-circle-info text-indigo-500',
  },
  success: {
    box: 'border-emerald-200',
    icon: 'fa-solid fa-circle-check text-emerald-500',
  },
  warning: {
    box: 'border-amber-200',
    icon: 'fa-solid fa-triangle-exclamation text-amber-500',
  },
  error: {
    box: 'border-rose-200',
    icon: 'fa-solid fa-circle-xmark text-rose-500',
  },
};

interface ToastContainerProps {
  toasts: ToastItem[];
  remove: (id: number) => void;
}

export function ToastContainer({
  toasts,
  remove,
}: ToastContainerProps) {
  return (
    <div className="absolute top-2 right-4 z-50 flex w-full max-w-sm flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
            key={t.id}
            className={cn(
                'pointer-events-auto p-3.5 rounded-xl border bg-white text-slate-800 shadow-lg flex items-center space-x-3 text-xs transition-all duration-300 transform',
                STYLES[t.type].box,
                t.visible
                ? 'translate-y-0 opacity-100'
                : 'translate-y-2 opacity-0',
            )}
            >
            <i
                className={cn(
                STYLES[t.type].icon,
                'text-base shrink-0',
                )}
            />

            <div className="flex-1">
                {t.message}
            </div>

            <button
                type="button"
                onClick={() => remove(t.id)}
                className="text-slate-400 hover:text-slate-600 shrink-0"
            >
                <i className="fa-solid fa-xmark" />
            </button>
            </div>
      ))}
    </div>
  );
}