'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showApiError: (err: unknown, fallback?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { box: string; icon: string }> = {
  info: { box: 'border-slate-200', icon: 'fa-solid fa-circle-info text-indigo-500' },
  success: { box: 'border-emerald-200', icon: 'fa-solid fa-circle-check text-emerald-500' },
  warning: { box: 'border-amber-200', icon: 'fa-solid fa-triangle-exclamation text-amber-500' },
  error: { box: 'border-rose-200', icon: 'fa-solid fa-circle-xmark text-rose-500' },
};

const SHOW_DELAY_MS = 10;
const LIFETIME_MS = 3500;
const LEAVE_MS = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const remove = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, type, visible: false }]);
      later(() => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t))), SHOW_DELAY_MS);
      later(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
        later(() => remove(id), LEAVE_MS);
      }, LIFETIME_MS);
    },
    [later, remove],
  );

  const showApiError = useCallback(
    (err: unknown, fallback = 'Request failed') => {
      const traceId = (err as { traceId?: string | null } | null)?.traceId;
      const code = (err as { code?: string | null } | null)?.code;
      if (traceId) console.error(`[${code ?? 'error'}] traceId=${traceId}`);
      console.error(err);
      showToast(err instanceof Error && err.message ? err.message : fallback, 'error');
    },
    [showToast],
  );

  const value = useMemo(() => ({ showToast, showApiError }), [showToast, showApiError]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-12 right-4 z-50 flex flex-col space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto p-3.5 rounded-xl border bg-white text-slate-800 shadow-lg flex items-start space-x-3 text-xs transition-all duration-300 transform',
              STYLES[t.type].box,
              t.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
            )}
          >
            <i className={cn(STYLES[t.type].icon, 'text-base mt-0.5')} />
            <div className="flex-1 pr-2">{t.message}</div>
            <button type="button" onClick={() => remove(t.id)} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
