import { useCallback, useRef, useState } from 'react';
import * as notificationApi from '@/lib/api/notification.api';
import { useToast } from '@/providers/ToastProvider';
import type { Notification } from '@/types/notification';
import { NOTIFICATION_PAGE_SIZE } from '../constants';

export function useNotifications() {
  const { showToast, showApiError } = useToast();

  const [items, setItems] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(false);

  const itemsRef = useRef<Notification[]>([]);
  const totalRef = useRef(0);
  const pageSizeRef = useRef(NOTIFICATION_PAGE_SIZE);
  const loadSeq = useRef(0);
  const moreBusy = useRef(false);
  const clearBusy = useRef(false);

  const apply = useCallback((nextItems: Notification[], nextTotal: number) => {
    itemsRef.current = nextItems;
    totalRef.current = nextTotal;
    setItems(nextItems);
    setTotal(nextTotal);
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(false);
    setLoadingMore(false);
    if (!itemsRef.current.length) setLoading(true);
    try {
      const res = await notificationApi.listPage({ page: 1, pageSize: pageSizeRef.current });
      if (seq !== loadSeq.current) return;
      pageSizeRef.current = res.pageSize;
      apply(res.items, res.totalItems);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(true);
      showApiError(err, 'Could not load notifications');
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [apply, showApiError]);

  const loadMore = useCallback(async () => {
    const current = itemsRef.current;
    if (moreBusy.current || current.length >= totalRef.current) return;

    const seq = loadSeq.current;
    moreBusy.current = true;
    setLoadingMore(true);
    try {
      const page = Math.floor(current.length / pageSizeRef.current) + 1;
      const res = await notificationApi.listPage({ page, pageSize: pageSizeRef.current });
      if (seq !== loadSeq.current) return;

      const known = new Set(itemsRef.current.map((n) => n.id));
      const fresh = res.items.filter((n) => !known.has(n.id));
      const next = [...itemsRef.current, ...fresh];
      apply(next, fresh.length ? res.totalItems : next.length);
    } catch (err) {
      if (seq === loadSeq.current) showApiError(err, 'Could not load more notifications');
    } finally {
      moreBusy.current = false;
      setLoadingMore(false);
    }
  }, [apply, showApiError]);

  const remove = useCallback(
    async (id: string) => {
      const index = itemsRef.current.findIndex((n) => n.id === id);
      if (index < 0) return;

      const removed = itemsRef.current[index];
      const seq = loadSeq.current;
      apply(
        itemsRef.current.filter((n) => n.id !== id),
        Math.max(0, totalRef.current - 1),
      );

      try {
        await notificationApi.remove(id);
      } catch (err) {
        if (seq === loadSeq.current && !itemsRef.current.some((n) => n.id === id)) {
          const next = [...itemsRef.current];
          next.splice(Math.min(index, next.length), 0, removed);
          apply(next, totalRef.current + 1);
        }
        showApiError(err, 'Could not remove notification');
      }
    },
    [apply, showApiError],
  );

  const clear = useCallback(async () => {
    if (clearBusy.current || !itemsRef.current.length) return;
    clearBusy.current = true;
    setClearing(true);
    try {
      await notificationApi.clear();
      loadSeq.current++;
      apply([], 0);
      setError(false);
      setLoading(false);
      setLoadingMore(false);
      showToast('All notifications cleared', 'success');
    } catch (err) {
      showApiError(err, 'Could not clear notifications');
    } finally {
      clearBusy.current = false;
      setClearing(false);
    }
  }, [apply, showApiError, showToast]);

  return {
    items,
    total,
    loading,
    loadingMore,
    clearing,
    error,
    hasMore: items.length < total,
    load,
    loadMore,
    remove,
    clear,
  };
}
