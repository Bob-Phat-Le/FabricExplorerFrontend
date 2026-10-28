import { useCallback, useState } from 'react';

/** Theo dõi nút nào đang bận (disable + mờ đi) trong lúc một thao tác bất đồng bộ chạy. */
export function useBusy() {
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());

  const isBusy = useCallback((id: string) => busy.has(id), [busy]);

  const withBusy = useCallback(async (ids: string | string[], fn: () => Promise<void>) => {
    const list = Array.isArray(ids) ? ids : [ids];
    setBusy((prev) => new Set([...prev, ...list]));
    try {
      await fn();
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        list.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, []);

  return { isBusy, withBusy };
}

export const BUSY_CLASS = 'opacity-60 cursor-not-allowed';
