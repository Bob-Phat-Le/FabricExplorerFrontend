import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as catalogApi from '@/lib/api/catalog.api';
import * as discoveryApi from '@/lib/api/discovery.api';
import { ApiError } from '@/lib/api/client';
import { useToast } from '@/providers/ToastProvider';
import type { CatalogTableDetail, CatalogTableItem, CatalogTableRef, CatalogTree } from '@/types/catalog';
import type { Lakehouse } from '@/types/discovery';
import { useDiscoveryContext } from '@/features/discovery/hooks/useDiscoveryContext';
import { useRequestGuard } from '@/features/discovery/hooks/useRequestGuard';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError || err instanceof Error ? err.message : fallback);
const detailKey = ({ schema, table }: CatalogTableRef) => `${schema}.${table}`;

const lastLakehouseKey = (connectionId: string) => `fabric-explorer:catalog-lakehouse:${connectionId}`;
const readLastLakehouse = (connectionId: string) => {
  try {
    return window.sessionStorage.getItem(lastLakehouseKey(connectionId));
  } catch {
    return null;
  }
};
const writeLastLakehouse = (connectionId: string, lakehouseId: string) => {
  try {
    window.sessionStorage.setItem(lastLakehouseKey(connectionId), lakehouseId);
  } catch {
    /* ignore */
  }
};

/**
 * State of Catalog → Tables: lakehouse picker, schema/table tree and column details.
 * Every request goes through useRequestGuard so a slow response of a previous
 * lakehouse/table can never overwrite the current one.
 */
export function useCatalogTables() {
  const { ctx } = useDiscoveryContext();
  const { showApiError } = useToast();
  const { latest, invalidate } = useRequestGuard();

  const [lakehouses, setLakehouses] = useState<Lakehouse[]>([]);
  const [lakehouseState, setLakehouseState] = useState<LoadState>('idle');
  const [lakehouseError, setLakehouseError] = useState<string | null>(null);
  // The selection is bound to the connection it was made for, so switching connection can never
  // fire a request for a lakehouse that belongs to the previous one.
  const [selection, setSelection] = useState<{ key: string; id: string | null }>({ key: '', id: null });

  const [tree, setTree] = useState<CatalogTree | null>(null);
  const [treeState, setTreeState] = useState<LoadState>('idle');
  const [treeError, setTreeError] = useState<string | null>(null);

  const [selected, setSelected] = useState<CatalogTableRef | null>(null);
  const [details, setDetails] = useState<Record<string, CatalogTableDetail>>({});
  const [detailState, setDetailState] = useState<LoadState>('idle');
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailsRef = useRef(details);
  detailsRef.current = details;

  const connectionId = ctx?.connectionId;
  const workspaceId = ctx?.workspaceId;
  const connectionKey = connectionId !== undefined ? `${connectionId}:${workspaceId}` : '';
  const lakehouseId = selection.key === connectionKey ? selection.id : null;

  const resetTree = useCallback(() => {
    invalidate('tree', 'detail');
    setTree(null);
    setTreeState('idle');
    setTreeError(null);
    setSelected(null);
    setDetails({});
    setDetailState('idle');
    setDetailError(null);
  }, [invalidate]);

  // ---- lakehouses of the active connection ----
  const loadLakehouses = useCallback(
    async (refresh = false) => {
      if (connectionId === undefined || workspaceId === undefined) {
        invalidate('lakehouses');
        setLakehouses([]);
        setSelection({ key: '', id: null });
        setLakehouseState('idle');
        resetTree();
        return;
      }

      const isCurrent = latest('lakehouses');
      setLakehouseState('loading');
      setLakehouseError(null);

      try {
        const list = (await discoveryApi.listLakehouses({ connectionId, workspaceId, refresh, signal: isCurrent.signal })) ?? [];
        if (!isCurrent()) return;

        setLakehouses(list);
        setLakehouseState('ready');
        setSelection((prev) => {
          const current = prev.key === connectionKey ? prev.id : null;
          if (current && list.some((l) => l.lakehouseId === current)) return prev;
          const remembered = readLastLakehouse(connectionId);
          const id = list.find((l) => l.lakehouseId === remembered)?.lakehouseId ?? list[0]?.lakehouseId ?? null;
          return { key: connectionKey, id };
        });
      } catch (err) {
        if (!isCurrent()) return;
        setLakehouses([]);
        setSelection({ key: connectionKey, id: null });
        setLakehouseState('error');
        setLakehouseError(errorMessage(err, 'Could not load lakehouses'));
        showApiError(err, 'Could not load lakehouses');
      }
    },
    [connectionId, workspaceId, connectionKey, latest, invalidate, resetTree, showApiError],
  );

  useEffect(() => {
    void loadLakehouses();
  }, [loadLakehouses]);

  // ---- schema/table tree of the selected lakehouse ----
  const loadTree = useCallback(
    async (refresh = false) => {
      if (connectionId === undefined || workspaceId === undefined || !lakehouseId) return;

      const isCurrent = latest('tree');
      setTreeState('loading');
      setTreeError(null);

      try {
        const result = await catalogApi.getCatalogTree({ connectionId, workspaceId, lakehouseId }, { refresh, signal: isCurrent.signal });
        if (!isCurrent()) return;

        setTree(result);
        setTreeState('ready');
        // keep the selection only if the table still exists after a reload
        setSelected((current) =>
          current && result.schemas.some((s) => s.name === current.schema && s.tables.some((t) => t.name === current.table)) ? current : null,
        );
      } catch (err) {
        if (!isCurrent()) return;
        setTree(null);
        setTreeState('error');
        setTreeError(errorMessage(err, 'Could not load tables'));
        showApiError(err, 'Could not load tables');
      }
    },
    [connectionId, workspaceId, lakehouseId, latest, showApiError],
  );

  useEffect(() => {
    resetTree();
    if (lakehouseId) void loadTree();
    // resetTree/loadTree are stable per lakehouse; this must re-run only when the lakehouse (or connection) changes
  }, [lakehouseId, loadTree, resetTree]);

  // ---- column details of the selected table ----
  const loadDetail = useCallback(
    async (ref: CatalogTableRef, { force = false }: { force?: boolean } = {}) => {
      if (connectionId === undefined || workspaceId === undefined || !lakehouseId) return;

      if (!force && detailsRef.current[detailKey(ref)]) {
        invalidate('detail');
        setDetailState('ready');
        setDetailError(null);
        return;
      }

      const isCurrent = latest('detail');
      setDetailState('loading');
      setDetailError(null);

      try {
        const detail = await catalogApi.getCatalogTable({ connectionId, workspaceId, lakehouseId }, ref, {
          refresh: force,
          signal: isCurrent.signal,
        });
        if (!isCurrent()) return;

        setDetails((prev) => ({ ...prev, [detailKey(ref)]: detail }));
        setDetailState('ready');
      } catch (err) {
        if (!isCurrent()) return;
        setDetailState('error');
        setDetailError(errorMessage(err, 'Could not load table columns'));
        showApiError(err, 'Could not load table columns');
      }
    },
    [connectionId, workspaceId, lakehouseId, latest, invalidate, showApiError],
  );

  const selectLakehouse = useCallback(
    (id: string) => {
      if (connectionId !== undefined) writeLastLakehouse(connectionId, id);
      setSelection({ key: connectionKey, id });
    },
    [connectionId, connectionKey],
  );

  const selectTable = useCallback(
    (ref: CatalogTableRef) => {
      setSelected(ref);
      void loadDetail(ref);
    },
    [loadDetail],
  );

  const selectedLakehouse = useMemo(() => lakehouses.find((l) => l.lakehouseId === lakehouseId) ?? null, [lakehouses, lakehouseId]);
  const selectedDetail = selected ? (details[detailKey(selected)] ?? null) : null;

  /** Column count is known from the list only if OneLake returned columns; the opened table always knows it. */
  const columnCountOf = useCallback(
    (table: CatalogTableItem) => details[detailKey({ schema: table.schema, table: table.name })]?.columns.length ?? table.columnCount,
    [details],
  );

  return {
    hasConnection: ctx !== null,

    lakehouses,
    lakehouseState,
    lakehouseError,
    selectedLakehouse,
    selectLakehouse,
    reloadLakehouses: () => loadLakehouses(true),

    tree,
    treeState,
    treeError,
    reloadTree: () => {
      // a manual refresh bypasses the backend cache for the tree and for the open table
      setDetails({});
      return Promise.all([loadTree(true), selected ? loadDetail(selected, { force: true }) : undefined]).then(() => undefined);
    },
    columnCountOf,

    selected,
    selectTable,
    selectedDetail,
    detailState,
    detailError,
    reloadDetail: () => (selected ? loadDetail(selected, { force: true }) : Promise.resolve()),
  };
}

export type CatalogTablesState = ReturnType<typeof useCatalogTables>;
