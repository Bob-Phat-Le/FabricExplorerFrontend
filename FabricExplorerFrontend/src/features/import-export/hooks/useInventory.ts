import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as configurationApi from '@/lib/api/configuration.api';
import { useToast } from '@/providers/ToastProvider';
import type { ConfigurationItem, ExportItemRef } from '@/types/configuration';
import { DEFAULT_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../constants';
import { selectionKey } from '../utils';

export interface Filters {
  search: string;
  type: string;
  status: string;
}

interface Paging {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Server-paged inventory + a selection that survives paging and filtering. */
export function useInventory() {
  const { showApiError } = useToast();

  const [filters, setFilters] = useState<Filters>({ search: '', type: '', status: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paging, setPaging] = useState<Paging>({ page: 1, pageSize: DEFAULT_PAGE_SIZE, totalItems: 0, totalPages: 1 });
  const [items, setItems] = useState<ConfigurationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReadonlyMap<string, ExportItemRef>>(() => new Map());
  const [selectingAll, setSelectingAll] = useState(false);

  const requestId = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [filters.search]);

  const { page, pageSize } = paging;
  const { type, status } = filters;

  const load = useCallback(
    async (targetPage = page) => {
      const id = ++requestId.current;
      setLoading(true);
      try {
        const res = await configurationApi.listItems({
          page: targetPage,
          pageSize,
          type,
          status,
          search: debouncedSearch,
        });
        if (id !== requestId.current) return;
        setItems(res.items);
        setPaging({ page: res.page, pageSize: res.pageSize, totalItems: res.totalItems, totalPages: res.totalPages });
      } catch (err) {
        if (id === requestId.current) showApiError(err, 'Could not load configurations');
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [page, pageSize, type, status, debouncedSearch, showApiError],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const patchFilters = useCallback((patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPaging((p) => ({ ...p, page: 1 }));
  }, []);

  const goToPage = useCallback((p: number) => setPaging((s) => ({ ...s, page: p })), []);
  const setPageSize = useCallback((size: number) => setPaging((s) => ({ ...s, pageSize: size, page: 1 })), []);

  // ---------- selection ----------

  const toggle = useCallback((item: ConfigurationItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      const k = selectionKey(item.type, item.id);
      if (next.has(k)) next.delete(k);
      else next.set(k, { type: item.type, id: item.id });
      return next;
    });
  }, []);

  const togglePage = useCallback(
    (checked: boolean) => {
      setSelected((prev) => {
        const next = new Map(prev);
        items.forEach((i) => {
          const k = selectionKey(i.type, i.id);
          if (checked) next.set(k, { type: i.type, id: i.id });
          else next.delete(k);
        });
        return next;
      });
    },
    [items],
  );

  /** Every item that matches the current filters, across all pages. */
  const selectAllMatching = useCallback(async () => {
    setSelectingAll(true);
    try {
      const all = await configurationApi.listAllItems({ type, status, search: debouncedSearch });
      setSelected((prev) => {
        const next = new Map(prev);
        all.forEach((i) => next.set(selectionKey(i.type, i.id), { type: i.type, id: i.id }));
        return next;
      });
    } catch (err) {
      showApiError(err, 'Could not select all matching items');
    } finally {
      setSelectingAll(false);
    }
  }, [type, status, debouncedSearch, showApiError]);

  const clearSelection = useCallback(() => setSelected(new Map()), []);

  const pageSelectedCount = useMemo(
    () => items.filter((i) => selected.has(selectionKey(i.type, i.id))).length,
    [items, selected],
  );

  return {
    filters,
    patchFilters,
    items,
    paging,
    loading,
    goToPage,
    setPageSize,
    reload: () => load(),
    selected,
    toggle,
    togglePage,
    selectAllMatching,
    selectingAll,
    clearSelection,
    pageSelectedCount,
  };
}
