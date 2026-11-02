import { useCallback, useEffect, useRef, useState } from 'react';
import type { DiscoveryContext } from '@/types/discovery';
import { useToast } from '@/providers/ToastProvider';
import { useDiscoveryContext } from './useDiscoveryContext';

export interface ResourceConfig<T> {
  /** Dùng trong thông báo, ví dụ "lakehouse" / "mirrored database". */
  noun: string;
  fetch: (ctx: DiscoveryContext) => Promise<T[]>;
  idOf: (item: T) => string;
  nameOf: (item: T) => string;
}

export interface ResourceListOptions {
  selectedId?: string | null;
  onSelectedIdChange?: (id: string) => void;
}

type Status =
  | 'loading'
  | 'no-connection'
  | 'empty'
  | 'error'
  | 'ready';

export function useResourceList<T extends { workspaceName?: string | null },>(
  cfg: ResourceConfig<T>,
  active: boolean,
  onReset: () => void,
  {
    selectedId: persistedSelectedId = null,
    onSelectedIdChange,
  }: ResourceListOptions = {},
) {
  const { showApiError, showToast } = useToast();
  const { ctx } = useDiscoveryContext();

  const connectionId = ctx?.connectionId;
  const workspaceId = ctx?.workspaceId;

  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [selectedId, setSelectedId] = useState('');

  const loadedFor = useRef<string | null>(null);
  const seq = useRef(0);
  const ctrl = useRef<AbortController | null>(null);
  const onResetRef = useRef(onReset);
  const persistedIdRef = useRef(persistedSelectedId);
  const onSelectedIdChangeRef = useRef(onSelectedIdChange);

  onResetRef.current = onReset;
  persistedIdRef.current = persistedSelectedId;
  onSelectedIdChangeRef.current = onSelectedIdChange;

  onResetRef.current = onReset;

  const select = useCallback((id: string) => {
    setSelectedId(id);
    onSelectedIdChangeRef.current?.(id);
  }, []);

  const ensureLoaded = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (connectionId === undefined) {
        loadedFor.current = null;
        onResetRef.current();
        setItems([]);
        setSelectedId('');
        setStatus('no-connection');
        return;
      }

      if (!force && loadedFor.current === connectionId) {
        return;
      }

      ctrl.current?.abort();

      const own = (ctrl.current = new AbortController());
      const mySeq = ++seq.current;

      onResetRef.current();
      setStatus('loading');

      try {
        const list =
          (await cfg.fetch({
            connectionId,
            workspaceId: workspaceId as string,
            refresh: force,
            signal: own.signal,
          })) ?? [];

        if (mySeq !== seq.current) {
          return;
        }

        loadedFor.current = connectionId;
        setItems(list);

        if (!list.length) {
          setSelectedId('');
          setStatus('empty');
          return;
        }

        const persistedId = persistedIdRef.current;
        const persistedItem =
          persistedId && list.some((item) => cfg.idOf(item) === persistedId)
            ? persistedId
            : null;

        const nextSelectedId = persistedItem ?? cfg.idOf(list[0]);

        setSelectedId(nextSelectedId);
        onSelectedIdChangeRef.current?.(nextSelectedId);
        setStatus('ready');
      } catch (err) {
        if (mySeq !== seq.current) {
          return;
        }

        loadedFor.current = null;
        setItems([]);
        setSelectedId('');
        setStatus('error');

        showApiError(
          err,
          `Could not load ${cfg.noun}s`,
        );
      }
    },
    [cfg, connectionId, workspaceId, showApiError],
  );

  useEffect(() => {
    if (active) void ensureLoaded();
  }, [active, ensureLoaded]);

  useEffect(
    () => () => {
      seq.current += 1;
      ctrl.current?.abort();
    },
    [],
  );

  const placeholder =
    status === 'no-connection'
      ? 'No active connection — set one in the Connection tab'
      : status === 'loading'
        ? 'Loading…'
        : status === 'empty'
          ? `No ${cfg.noun}s found in workspace`
          : status === 'error'
            ? `Could not load ${cfg.noun}s — click Reload`
            : null;

  const resourceOptions =
    status === 'ready'
      ? items.map((item) => ({
          value: cfg.idOf(item),
          label: `${cfg.nameOf(item)} (${
            item.workspaceName ?? 'Workspace'
          })`,
        }))
      : [];

  const getSelected = useCallback((): T | null => {
    const item = selectedId
      ? (items.find(
          (item) => cfg.idOf(item) === selectedId,
        ) ?? null)
      : null;

    if (!item) {
      showToast(
        `Select a ${cfg.noun} first.`,
        'warning',
      );
    }

    return item;
  }, [
    cfg,
    items,
    selectedId,
    showToast,
  ]);

  const selectedLabel = resourceOptions.find(
    (option) => option.value === selectedId,
  )?.label;

  return {
    placeholder,
    options: resourceOptions,
    selectedId,
    selectedLabel,
    select,
    reload: () => ensureLoaded({ force: true }),
    getSelected,
  };
}

export type ResourceList = ReturnType<
  typeof useResourceList
>;