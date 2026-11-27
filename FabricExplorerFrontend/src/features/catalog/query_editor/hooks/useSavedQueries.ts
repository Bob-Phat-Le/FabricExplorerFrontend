import { useCallback, useEffect, useState } from 'react';
import type { LoadState } from '@/features/catalog/table/hooks/useCatalogTables';
import { useRequestGuard } from '@/features/discovery/hooks/useRequestGuard';
import * as savedQueriesApi from '@/lib/api/savedQueries.api';
import { useToast } from '@/providers/ToastProvider';
import type { SavedQueriesPage } from '@/types/savedQuery/SavedQueriesPage';
import type { SavedQueryScope } from '@/types/savedQuery/SavedQueryScope';
import { SAVED_QUERIES_PAGE_SIZE, SEARCH_DEBOUNCE_MS } from '../constants';

/** Server-side paged and searched list behind the "Saved Queries" modal. */
export function useSavedQueries(activeConnectionId: string | undefined) {
  const { showToast, showApiError } = useToast();
  const { latest } = useRequestGuard();

  const [scope, setScopeState] = useState<SavedQueryScope>('connection');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const [reloadTick, setReloadTick] = useState(0);

  const [data, setData] = useState<SavedQueriesPage | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // a typed search is applied after a short pause, and always from the first page
  useEffect(() => {
    const timer = setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const connectionFilter = scope === 'connection' ? activeConnectionId : undefined;
  const blocked = scope === 'connection' && activeConnectionId === undefined;

  useEffect(() => {
    if (blocked) {
      setData(null);
      setState('ready');
      return;
    }

    const isCurrent = latest('saved-queries');
    setState('loading');
    setError(null);

    savedQueriesApi
      .list({ page, pageSize: SAVED_QUERIES_PAGE_SIZE, search: term, connectionId: connectionFilter }, { signal: isCurrent.signal })
      .then((result) => {
        if (!isCurrent()) return;
        setData(result);
        setState('ready');
        setSelectedId((current) => (result.items.some((q) => q.id === current) ? current : (result.items[0]?.id ?? null)));
      })
      .catch((err: unknown) => {
        if (!isCurrent()) return;
        setData(null);
        setState('error');
        setError(err instanceof Error ? err.message : 'Could not load saved queries');
        showApiError(err, 'Could not load saved queries');
      });
  }, [blocked, page, term, connectionFilter, reloadTick, latest, showApiError]);

  const setScope = useCallback((next: SavedQueryScope) => {
    setScopeState(next);
    setPage(1);
  }, []);

  const reload = useCallback(() => setReloadTick((n) => n + 1), []);

  const remove = useCallback(
    async (id: string) => {
      try {
        await savedQueriesApi.remove(id);
        showToast('Saved query deleted', 'success');
        // deleting the last row of a page would otherwise leave an empty page behind
        if (data && data.items.length === 1 && page > 1) setPage(page - 1);
        else reload();
        return true;
      } catch (err) {
        showApiError(err, 'Could not delete the saved query');
        return false;
      }
    },
    [data, page, reload, showToast, showApiError],
  );

  const items = data?.items ?? [];

  return {
    scope,
    setScope,
    search,
    setSearch,
    page,
    setPage,
    data,
    items,
    state,
    error,
    blocked,
    selected: items.find((q) => q.id === selectedId) ?? null,
    select: setSelectedId,
    reload,
    remove,
  };
}
