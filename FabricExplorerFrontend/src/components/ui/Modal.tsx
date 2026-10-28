import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Modal({ children, maxWidth = 'max-w-2xl' }: { children: ReactNode; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-2xl w-full p-6 space-y-5 my-8', maxWidth)}>
        {children}
      </div>
    </div>
  );
}

export function ModalCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
    >
      <i className="fa-solid fa-xmark text-base" />
    </button>
  );
}
