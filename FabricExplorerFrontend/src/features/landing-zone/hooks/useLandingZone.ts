import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as lzApi from '@/lib/api/landingZone.api';
import { ApiError } from '@/lib/api/client';
import { useConnection } from '@/providers/ConnectionProvider';
import { useToast } from '@/providers/ToastProvider';
import { useRequestGuard } from '@/features/discovery/hooks/useRequestGuard';
import type {
  ConfigureLandingZonePayload,
  LandingZoneBatch,
  LandingZoneConfig,
  LandingZoneFolder,
  LandingZoneItem,
  LandingZoneItemRef,
  LandingZoneOperation,
  LandingZoneSearchScope,
  LandingZoneSortField,
  LandingZoneViewMode,
} from '@/types/landingZone';
import { PAGE_SIZE, pathTrail, saveBlob, sortItems } from '../utils';

export type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const errorMessage = (err: unknown, fallback: string) => (err instanceof ApiError || err instanceof Error ? err.message : fallback);
const ROOT = '';
const MAX_EXPAND_DEPTH = 5;
const MAX_EXPAND_FOLDERS = 200;

/**
 * State of the Landing Zone Explorer: configuration of the active connection, the folder tree (loaded lazily),
 * the current folder (or recursive search results), selection and every file operation.
 */
export function useLandingZone() {
  const { activeConnection } = useConnection();
  const { showToast, showApiError } = useToast();
  const { latest, invalidate } = useRequestGuard();

  const connectionId = activeConnection?.id;
  const connectionRef = useRef(connectionId);
  connectionRef.current = connectionId;

  // ---- configuration ----
  const [config, setConfig] = useState<LandingZoneConfig | null>(null);
  const [configState, setConfigState] = useState<LoadState>('idle');
  const [configError, setConfigError] = useState<string | null>(null);

  // ---- current folder ----
  const [currentPath, setCurrentPath] = useState(ROOT);
  const [listing, setListing] = useState<LandingZoneItem[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [listState, setListState] = useState<LoadState>('idle');
  const [listError, setListError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // ---- folder tree ----
  const [children, setChildren] = useState<Record<string, LandingZoneFolder[]>>({});
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set([ROOT]));
  const [loadingFolders, setLoadingFolders] = useState<ReadonlySet<string>>(() => new Set());
  const childrenRef = useRef(children);
  childrenRef.current = children;
  const expandedRef = useRef(expanded);
  expandedRef.current = expanded;

  // ---- view options ----
  const [searchText, setSearchText] = useState('');
  const [searchScope, setSearchScope] = useState<LandingZoneSearchScope>('current');
  const [searchResults, setSearchResults] = useState<LandingZoneItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [sortField, setSortField] = useState<LandingZoneSortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<LandingZoneViewMode>('list');
  const [page, setPage] = useState(1);

  // ---- selection ----
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  // ---- history ----
  const [operations, setOperations] = useState<LandingZoneOperation[]>([]);

  const [working, setWorking] = useState(false);

  const query = searchText.trim();
  const recursiveSearch = query.length > 0 && searchScope === 'recursive';

  // =====================================================================
  // loading
  // =====================================================================

  const loadFolder = useCallback(
    async (path: string) => {
      if (!connectionId) return;
      const isCurrent = latest('list');
      setListState('loading');
      setListError(null);
      try {
        const res = await lzApi.listItems(connectionId, path, { signal: isCurrent.signal });
        if (!isCurrent()) return;
        setListing(res.items);
        setTruncated(res.truncated);
        setListState('ready');
        setLastRefreshed(new Date());
      } catch (err) {
        if (!isCurrent()) return;
        setListing([]);
        setTruncated(false);
        setListState('error');
        setListError(errorMessage(err, 'Could not load this folder'));
        showApiError(err, 'Could not load this folder');
      }
    },
    [connectionId, latest, showApiError],
  );

  const loadChildren = useCallback(
    async (path: string) => {
      if (!connectionId) return;
      setLoadingFolders((prev) => new Set(prev).add(path));
      try {
        const res = await lzApi.listFolders(connectionId, path);
        if (connectionRef.current !== connectionId) return;
        setChildren((prev) => ({ ...prev, [path]: res.folders }));
      } catch (err) {
        if (connectionRef.current === connectionId) showApiError(err, 'Could not load folders');
      } finally {
        setLoadingFolders((prev) => {
          const next = new Set(prev);
          next.delete(path);
          return next;
        });
      }
    },
    [connectionId, showApiError],
  );

  /** Reloads the folders that are currently open in the tree. */
  const reloadTree = useCallback(async () => {
    const open = Array.from(expandedRef.current);
    await Promise.all(open.map((p) => loadChildren(p)));
  }, [loadChildren]);

  const loadOperations = useCallback(async () => {
    if (!connectionId) return;
    try {
      const list = await lzApi.listOperations(connectionId);
      if (connectionRef.current === connectionId) setOperations(list ?? []);
    } catch {
      /* history is secondary: never block or toast */
    }
  }, [connectionId]);

  const resetBrowse = useCallback(() => {
    invalidate('list', 'search');
    setCurrentPath(ROOT);
    setListing([]);
    setTruncated(false);
    setListState('idle');
    setListError(null);
    setChildren({});
    setExpanded(new Set([ROOT]));
    setSearchText('');
    setSearchResults(null);
    setSelected(new Set());
    setOperations([]);
    setPage(1);
  }, [invalidate]);

  const loadConfig = useCallback(async () => {
    if (!connectionId) {
      invalidate('config');
      setConfig(null);
      setConfigState('idle');
      resetBrowse();
      return;
    }

    const isCurrent = latest('config');
    setConfigState('loading');
    setConfigError(null);
    try {
      const res = await lzApi.getConfig(connectionId, { signal: isCurrent.signal });
      if (!isCurrent()) return;
      setConfig(res);
      setConfigState('ready');
      resetBrowse();
      if (res.isConfigured) {
        void loadFolder(ROOT);
        void loadChildren(ROOT);
        void loadOperations();
      }
    } catch (err) {
      if (!isCurrent()) return;
      setConfig(null);
      setConfigState('error');
      setConfigError(errorMessage(err, 'Could not load the Landing Zone configuration'));
      showApiError(err, 'Could not load the Landing Zone configuration');
    }
  }, [connectionId, latest, invalidate, resetBrowse, loadFolder, loadChildren, loadOperations, showApiError]);

  useEffect(() => {
    void loadConfig();
    // reload only when the connection changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionId]);

  // recursive search (debounced)
  useEffect(() => {
    if (!connectionId || !recursiveSearch) {
      invalidate('search');
      setSearchResults(null);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      const isCurrent = latest('search');
      setSearching(true);
      try {
        const res = await lzApi.search(connectionId, query, ROOT, { signal: isCurrent.signal });
        if (!isCurrent()) return;
        setSearchResults(res.items);
      } catch (err) {
        if (!isCurrent()) return;
        setSearchResults([]);
        showApiError(err, 'Search failed');
      } finally {
        if (isCurrent()) setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [connectionId, recursiveSearch, query, latest, invalidate, showApiError]);

  // =====================================================================
  // navigation & tree
  // =====================================================================

  const navigate = useCallback(
    (path: string) => {
      setCurrentPath(path);
      setSelected(new Set());
      setPage(1);

      // open every ancestor so the folder is visible in the tree
      const ancestors = [ROOT, ...pathTrail(path).slice(0, -1).map((t) => t.path)];
      setExpanded((prev) => new Set([...prev, ...ancestors]));
      ancestors.filter((p) => !childrenRef.current[p]).forEach((p) => void loadChildren(p));

      void loadFolder(path);
    },
    [loadFolder, loadChildren],
  );

  const toggleExpand = useCallback(
    (path: string) => {
      const isOpen = expandedRef.current.has(path);
      setExpanded((prev) => {
        const next = new Set(prev);
        if (isOpen) next.delete(path);
        else next.add(path);
        return next;
      });
      if (!isOpen && !childrenRef.current[path]) void loadChildren(path);
    },
    [loadChildren],
  );

  const expandAll = useCallback(async () => {
    if (!connectionId) return;
    const known: Record<string, LandingZoneFolder[]> = { ...childrenRef.current };
    const open = new Set<string>([ROOT]);
    let level = [ROOT];
    let visited = 0;

    for (let depth = 0; depth < MAX_EXPAND_DEPTH && level.length > 0 && visited < MAX_EXPAND_FOLDERS; depth++) {
      const loaded = await Promise.all(
        level.map(async (path) => {
          if (!known[path]) {
            try {
              known[path] = (await lzApi.listFolders(connectionId, path)).folders;
            } catch {
              known[path] = [];
            }
          }
          return known[path];
        }),
      );
      level.forEach((p) => open.add(p));
      level = loaded.flat().map((f) => f.path);
      visited += level.length;
    }

    if (connectionRef.current !== connectionId) return;
    setChildren((prev) => ({ ...prev, ...known }));
    setExpanded(open);
    if (level.length > 0) showToast('Expanded the first levels only; open deeper folders manually.', 'info');
  }, [connectionId, showToast]);

  const refresh = useCallback(
    async (silent = false) => {
      await Promise.all([loadFolder(currentPath), reloadTree(), loadOperations()]);
      if (!silent) showToast('Landing Zone refreshed', 'info');
    },
    [loadFolder, currentPath, reloadTree, loadOperations, showToast],
  );

  // =====================================================================
  // visible items, selection
  // =====================================================================

  const sorted = useMemo(() => {
    const base = recursiveSearch
      ? (searchResults ?? [])
      : listing.filter((i) => !query || i.name.toLowerCase().includes(query.toLowerCase()));
    return sortItems(base, sortField, sortAsc);
  }, [recursiveSearch, searchResults, listing, query, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [sorted, safePage]);

  const knownItems = useMemo(() => {
    const map = new Map<string, LandingZoneItem>();
    listing.forEach((i) => map.set(i.path, i));
    (searchResults ?? []).forEach((i) => map.set(i.path, i));
    return map;
  }, [listing, searchResults]);

  const selectedItems = useMemo(
    () => Array.from(selected).map((p) => knownItems.get(p)).filter((i): i is LandingZoneItem => !!i),
    [selected, knownItems],
  );

  const toggleSelected = useCallback((path: string, on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(path);
      else next.delete(path);
      return next;
    });
  }, []);

  const selectAll = useCallback((on: boolean) => setSelected(on ? new Set(sorted.map((i) => i.path)) : new Set()), [sorted]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const sortBy = useCallback(
    (field: LandingZoneSortField) => {
      if (field === sortField) setSortAsc((a) => !a);
      else {
        setSortField(field);
        setSortAsc(true);
      }
    },
    [sortField],
  );

  // =====================================================================
  // operations
  // =====================================================================

  const afterChange = useCallback(async () => {
    setSelected(new Set());
    await Promise.all([loadFolder(currentPath), reloadTree(), loadOperations()]);
    // keep a recursive search result in sync
    if (recursiveSearch && connectionId) {
      try {
        setSearchResults((await lzApi.search(connectionId, query, ROOT)).items);
      } catch {
        /* ignore */
      }
    }
  }, [loadFolder, currentPath, reloadTree, loadOperations, recursiveSearch, connectionId, query]);

  const reportBatch = useCallback(
    (verb: string, batch: LandingZoneBatch) => {
      if (batch.failed === 0) {
        showToast(`${verb} ${batch.succeeded} item${batch.succeeded === 1 ? '' : 's'} successfully`, 'success');
        return;
      }
      const firstError = batch.results.find((r) => !r.success)?.error ?? 'Operation failed';
      if (batch.succeeded > 0) showToast(`${verb} ${batch.succeeded}, failed ${batch.failed}: ${firstError}`, 'warning');
      else showToast(firstError, 'error');
    },
    [showToast],
  );

  /** Runs a mutation; always refreshes afterwards (the history records failures too). Returns true on success. */
  const run = useCallback(
    async <T,>(fn: (id: string) => Promise<T>, onDone: (result: T) => void, fallback: string): Promise<boolean> => {
      if (!connectionId) return false;
      setWorking(true);
      try {
        const result = await fn(connectionId);
        onDone(result);
        await afterChange();
        return true;
      } catch (err) {
        showApiError(err, fallback);
        void loadOperations();
        return false;
      } finally {
        setWorking(false);
      }
    },
    [connectionId, afterChange, showApiError, loadOperations],
  );

  const createFolder = useCallback(
    (name: string) =>
      run(
        (id) => lzApi.createFolder(id, currentPath, name),
        () => showToast(`Folder "${name}" created`, 'success'),
        'Could not create the folder',
      ),
    [run, currentPath, showToast],
  );

  const renameItem = useCallback(
    (item: LandingZoneItem, newName: string) =>
      run(
        (id) => lzApi.renameItem(id, { path: item.path, isFolder: item.isFolder }, newName),
        () => showToast(`Renamed to "${newName}"`, 'success'),
        'Could not rename the item',
      ),
    [run, showToast],
  );

  const transfer = useCallback(
    (mode: 'move' | 'copy', items: LandingZoneItemRef[], destination: string) =>
      run(
        (id) => lzApi.transferItems(id, mode, items, destination),
        (batch) => reportBatch(mode === 'move' ? 'Moved' : 'Copied', batch),
        `Could not ${mode} the items`,
      ),
    [run, reportBatch],
  );

  const deleteItems = useCallback(
    (items: LandingZoneItemRef[]) =>
      run(
        (id) => lzApi.deleteItems(id, items),
        (batch) => reportBatch('Deleted', batch),
        'Could not delete the items',
      ),
    [run, reportBatch],
  );

  const upload = useCallback(
    (files: File[], overwrite: boolean) =>
      run(
        (id) => lzApi.uploadFiles(id, currentPath, files, overwrite),
        (batch) => reportBatch('Uploaded', batch),
        'Upload failed',
      ),
    [run, currentPath, reportBatch],
  );

  const downloadItems = useCallback(
    async (items: LandingZoneItem[]) => {
      if (!connectionId) return;
      // const files = items.filter((i) => !i.isFolder);
      const files = items
      if (files.length === 0) {
        showToast('Select at least one file to download', 'warning');
        return;
      }
      try {
        if (files.length === 1 && !files[0].isFolder) {
          saveBlob(await lzApi.downloadFile(connectionId, files[0].path), files[0].name);
        } else {
          saveBlob(await lzApi.downloadArchive(connectionId, files.map((f) => f.path)), 'landing-zone-files.zip');
        }
        if (files.length < items.length) showToast('Folders are skipped: only files can be downloaded', 'info');
        void loadOperations();
      } catch (err) {
        showApiError(err, 'Download failed');
        void loadOperations();
      }
    },
    [connectionId, showToast, showApiError, loadOperations],
  );

  // =====================================================================
  // configuration commands
  // =====================================================================

  const saveConfig = useCallback(
    async (payload: ConfigureLandingZonePayload) => {
      if (!connectionId) return false;
      setWorking(true);
      try {
        const res = await lzApi.configure(connectionId, payload);
        setConfig(res);
        resetBrowse();
        showToast('Landing Zone configured', 'success');
        void loadFolder(ROOT);
        void loadChildren(ROOT);
        void loadOperations();
        return true;
      } catch (err) {
        showApiError(err, 'Could not configure the Landing Zone');
        return false;
      } finally {
        setWorking(false);
      }
    },
    [connectionId, resetBrowse, loadFolder, loadChildren, loadOperations, showToast, showApiError],
  );

  const removeConfig = useCallback(async () => {
    if (!connectionId) return false;
    setWorking(true);
    try {
      await lzApi.removeConfig(connectionId);
      setConfig({ isConfigured: false, storageEndpoint: null, fileSystem: null, rootPath: null, uri: null, updatedAt: null });
      resetBrowse();
      showToast('Landing Zone configuration removed', 'info');
      return true;
    } catch (err) {
      showApiError(err, 'Could not remove the configuration');
      return false;
    } finally {
      setWorking(false);
    }
  }, [connectionId, resetBrowse, showToast, showApiError]);

  return {
    hasConnection: connectionId !== undefined,
    connectionId,

    config,
    configState,
    configError,
    reloadConfig: loadConfig,
    saveConfig,
    removeConfig,

    currentPath,
    navigate,
    listState,
    listError,
    truncated,
    lastRefreshed,
    refresh,

    children,
    expanded,
    loadingFolders,
    toggleExpand,
    expandAll,

    searchText,
    setSearchText,
    searchScope,
    setSearchScope,
    searching,
    recursiveSearch,
    sortField,
    sortAsc,
    sortBy,
    viewMode,
    setViewMode,

    items: pageItems,
    totalItems: sorted.length,
    page: safePage,
    totalPages,
    setPage,

    selected,
    selectedItems,
    toggleSelected,
    selectAll,
    clearSelection,
    allSelected: sorted.length > 0 && sorted.every((i) => selected.has(i.path)),

    operations,
    working,
    createFolder,
    renameItem,
    transfer,
    deleteItems,
    upload,
    downloadItems,
  };
}

export type LandingZoneState = ReturnType<typeof useLandingZone>;
