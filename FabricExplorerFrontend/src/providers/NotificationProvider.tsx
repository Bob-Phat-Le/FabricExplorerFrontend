'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as notificationApi from '@/lib/api/notification.api';
import { streamNotifications } from '@/lib/api/stream';
import { useToast } from '@/providers/ToastProvider';
import type { Notification, NotificationFilter, NotificationStreamEvent } from '@/types/notification';

export const NOTIFICATION_PAGE_SIZE = 20;

interface NotificationContextValue {
  items: Notification[];
  unreadCount: number;
  filter: NotificationFilter;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: boolean;
  markingAll: boolean;
  setFilter: (filter: NotificationFilter) => void;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { showToast, showApiError } = useToast();

  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilterState] = useState<NotificationFilter>('all');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMoreState] = useState(false);
  const [error, setError] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const itemsRef = useRef<Notification[]>([]);
  const filterRef = useRef<NotificationFilter>('all');
  const hasMoreRef = useRef(false);
  const loadSeq = useRef(0);
  const moreBusy = useRef(false);
  const markAllBusy = useRef(false);

  const commit = useCallback((next: Notification[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const setHasMore = useCallback((value: boolean) => {
    hasMoreRef.current = value;
    setHasMoreState(value);
  }, []);

  /** Tải lại từ đầu (skip = 0). Giữ danh sách cũ trong lúc tải để không bị nháy. */
  const refresh = useCallback(async () => {
    const seq = ++loadSeq.current;
    moreBusy.current = false;
    setError(false);
    setLoadingMore(false);
    if (!itemsRef.current.length) setLoading(true);
    try {
      const rows = await notificationApi.list({
        skip: 0,
        take: NOTIFICATION_PAGE_SIZE,
        unreadOnly: filterRef.current === 'unread',
      });
      if (seq !== loadSeq.current) return;
      commit(rows);
      setHasMore(rows.length === NOTIFICATION_PAGE_SIZE);
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(true);
      showApiError(err, 'Could not load notifications');
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [commit, setHasMore, showApiError]);

  const loadMore = useCallback(async () => {
    if (moreBusy.current || !hasMoreRef.current) return;

    const seq = loadSeq.current;
    moreBusy.current = true;
    setLoadingMore(true);
    try {
      // Backend phân trang theo skip/take và không trả tổng số: hết dữ liệu khi trang trả về chưa đầy.
      const rows = await notificationApi.list({
        skip: itemsRef.current.length,
        take: NOTIFICATION_PAGE_SIZE,
        unreadOnly: filterRef.current === 'unread',
      });
      if (seq !== loadSeq.current) return;

      const known = new Set(itemsRef.current.map((n) => n.id));
      const fresh = rows.filter((n) => !known.has(n.id));
      commit([...itemsRef.current, ...fresh]);
      setHasMore(rows.length === NOTIFICATION_PAGE_SIZE && fresh.length > 0);
    } catch (err) {
      if (seq === loadSeq.current) showApiError(err, 'Could not load more notifications');
    } finally {
      if (seq === loadSeq.current) {
        moreBusy.current = false;
        setLoadingMore(false);
      }
    }
  }, [commit, setHasMore, showApiError]);

  const setFilter = useCallback(
    (next: NotificationFilter) => {
      if (next === filterRef.current) return;
      filterRef.current = next;
      setFilterState(next);
      commit([]);
      setHasMore(false);
      void refresh();
    },
    [commit, refresh, setHasMore],
  );

  /** Optimistic: đổi UI ngay, lỗi thì khôi phục đúng vị trí cũ. */
  const markAsRead = useCallback(
    async (id: string) => {
      const index = itemsRef.current.findIndex((n) => n.id === id);
      const target = itemsRef.current[index];
      if (!target || target.isRead) return;

      const onlyUnread = filterRef.current === 'unread';
      const optimistic: Notification = { ...target, isRead: true, readAt: new Date().toISOString() };
      commit(
        onlyUnread
          ? itemsRef.current.filter((n) => n.id !== id)
          : itemsRef.current.map((n) => (n.id === id ? optimistic : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      try {
        const updated = await notificationApi.markAsRead(id);
        if (!onlyUnread && updated) commit(itemsRef.current.map((n) => (n.id === id ? updated : n)));
      } catch (err) {
        const current = itemsRef.current;
        if (current.some((n) => n.id === id)) {
          commit(current.map((n) => (n.id === id ? target : n)));
        } else {
          const next = [...current];
          next.splice(Math.min(index, next.length), 0, target);
          commit(next);
        }
        setUnreadCount((c) => c + 1);
        showApiError(err, 'Could not mark notification as read');
      }
    },
    [commit, showApiError],
  );

  const markAllAsRead = useCallback(async () => {
    if (markAllBusy.current) return;
    markAllBusy.current = true;
    setMarkingAll(true);
    try {
      await notificationApi.markAllAsRead();
      const now = new Date().toISOString();
      if (filterRef.current === 'unread') {
        commit([]);
        setHasMore(false);
      } else {
        commit(itemsRef.current.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt: now })));
      }
      setUnreadCount(0);
    } catch (err) {
      showApiError(err, 'Could not mark all notifications as read');
    } finally {
      markAllBusy.current = false;
      setMarkingAll(false);
    }
  }, [commit, setHasMore, showApiError]);

  // Sự kiện realtime: `unread-count` (đồng bộ số) và `notification` (thông báo mới).
  const handleStreamEvent = useCallback(
    (name: string, payload: unknown) => {
      const evt = payload as NotificationStreamEvent | null;
      if (!evt) return;
      if (typeof evt.unreadCount === 'number') setUnreadCount(evt.unreadCount);

      if (name === 'notification' && evt.notification) {
        const incoming = evt.notification;
        if (!itemsRef.current.some((n) => n.id === incoming.id)) commit([incoming, ...itemsRef.current]);
        showToast(incoming.title, incoming.type.endsWith('.failed') ? 'error' : 'success');
      }
    },
    [commit, showToast],
  );

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const ctrl = new AbortController();

    // Số chưa đọc ban đầu (chạy cả ở chế độ mock, nơi không có SSE).
    notificationApi
      .getUnreadCount()
      .then((count) => {
        if (!ctrl.signal.aborted) setUnreadCount(count);
      })
      .catch((err) => console.error('Could not load unread notification count', err));

    streamNotifications({
      signal: ctrl.signal,
      onEvent: handleStreamEvent,
      // Nối lại sau khi mất kết nối: có thể đã lỡ sự kiện, DB mới là nguồn sự thật nên tải lại danh sách.
      onOpen: (reconnected) => {
        if (reconnected) void refreshRef.current();
      },
    }).catch((err) => console.error('Notification stream failed', err));

    return () => ctrl.abort();
  }, [handleStreamEvent]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      items,
      unreadCount,
      filter,
      loading,
      loadingMore,
      hasMore,
      error,
      markingAll,
      setFilter,
      refresh,
      loadMore,
      markAsRead,
      markAllAsRead,
    }),
    [items, unreadCount, filter, loading, loadingMore, hasMore, error, markingAll, setFilter, refresh, loadMore, markAsRead, markAllAsRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
