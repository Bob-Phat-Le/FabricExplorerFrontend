import { useCallback, useRef, useState } from 'react';
import * as connectionsApi from '@/lib/api/connections.api';
import { useConnection } from '@/providers/ConnectionProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Connection } from '@/types/connection';
import { CONN_PAGE_SIZE_DEFAULT } from '../constants';

export interface Paging {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function useConnections() {
  const { showApiError } = useToast();
  const { refreshActive, setActiveConnection } = useConnection();

  const [connections, setConnections] = useState<Connection[]>([]);
  const [paging, setPagingState] = useState<Paging>({
    page: 1,
    pageSize: CONN_PAGE_SIZE_DEFAULT,
    total: 0,
    totalPages: 1,
  });
  const pagingRef = useRef(paging);
  const loadSeq = useRef(0);

  const setPaging = useCallback((next: Paging) => {
    pagingRef.current = next;
    setPagingState(next);
  }, []);

  const load: () => Promise<Connection | null | undefined> = useCallback(async () => {
    const seq = ++loadSeq.current;
    const { page, pageSize } = pagingRef.current;
    try {
      const [res, active] = await Promise.all([connectionsApi.listPage({ page, pageSize }), refreshActive()]);
      if (seq !== loadSeq.current) return undefined;

      const next: Paging = { page: res.page, pageSize: res.pageSize, total: res.totalItems, totalPages: res.totalPages };
      setPaging(next);

      if (!res.items.length && res.totalItems > 0 && next.page > res.totalPages) {
        setPaging({ ...next, page: res.totalPages });
        return load();
      }

      setConnections(res.items);
      if (active === undefined) return undefined;
      const resolved = active ?? res.items.find((c) => c.isActive) ?? null;
      setActiveConnection(resolved);
      return resolved;
    } catch (err) {
      if (seq === loadSeq.current) showApiError(err, 'Could not load connections');
      return undefined;
    }
  }, [refreshActive, setActiveConnection, setPaging, showApiError]);

  const goToPage = useCallback(
    async (page: number) => {
      const cur = pagingRef.current;
      const target = Math.min(Math.max(1, page), Math.max(1, cur.totalPages));
      if (target === cur.page) return;
      setPaging({ ...cur, page: target });
      await load();
    },
    [load, setPaging],
  );

  const reload = useCallback(
    async (pageSize?: number) => {
      const cur = pagingRef.current;
      if (pageSize !== undefined && pageSize !== cur.pageSize) setPaging({ ...cur, pageSize, page: 1 });
      await load();
    },
    [load, setPaging],
  );

  return { connections, paging, load, goToPage, reload };
}
