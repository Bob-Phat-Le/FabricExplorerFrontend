'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showApiError: (err: unknown, fallback?: string) => void;
  toasts: ToastItem[];
  remove: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

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

  const remove = useCallback(
    (id: number) =>
      setToasts((prev) => prev.filter((t) => t.id !== id)),
    [],
  );

  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = nextId.current++;

      setToasts((prev) => [
        ...prev,
        { id, message, type, visible: false },
      ]);

      later(
        () =>
          setToasts((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, visible: true } : t,
            ),
          ),
        SHOW_DELAY_MS,
      );

      later(() => {
        setToasts((prev) =>
          prev.map((t) =>
            t.id === id ? { ...t, visible: false } : t,
          ),
        );

        later(() => remove(id), LEAVE_MS);
      }, LIFETIME_MS);
    },
    [later, remove],
  );

  const showApiError = useCallback(
    (err: unknown, fallback = 'Request failed') => {
      const traceId = (err as { traceId?: string | null } | null)?.traceId;
      const code = (err as { code?: string | null } | null)?.code;

      if (traceId) {
        console.error(`[${code ?? 'error'}] traceId=${traceId}`);
      }

      console.error(err);

      showToast(
        err instanceof Error && err.message ? err.message : fallback,
        'error',
      );
    },
    [showToast],
  );

  const value = useMemo(
    () => ({
      showToast,
      showApiError,
      toasts,
      remove,
    }),
    [showToast, showApiError, toasts, remove],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }

  return ctx;
}