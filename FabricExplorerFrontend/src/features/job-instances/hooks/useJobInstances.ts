import { useCallback, useEffect, useRef, useState } from 'react';
import * as itemsApi from '@/lib/api/items.api';
import { useToast } from '@/providers/ToastProvider';
import type { FabricItem, JobInstance } from '@/types/fabric';

export function useJobInstances() {
  const { showToast, showApiError } = useToast();

  const [items, setItems] = useState<FabricItem[]>([]);
  const [activeItem, setActiveItem] = useState<FabricItem | null>(null);
  const [jobs, setJobs] = useState<JobInstance[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const itemsLoaded = useRef(false);

  const loadItems = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    if (itemsLoaded.current && !force) return;
    setItems(await itemsApi.list());
    itemsLoaded.current = true;
  }, []);

  useEffect(() => {
    loadItems().catch((err) => showApiError(err));
  }, [loadItems, showApiError]);

  const loadJobs = useCallback(
    async (item: FabricItem) => {
      try {
        const page = await itemsApi.listJobs(item.id, {});
        setJobs(page.items);
        setNextToken(page.continuationToken || null);
      } catch (err) {
        showApiError(err, 'Could not load job instances');
      }
    },
    [showApiError],
  );

  const selectItem = useCallback(
    async (item: FabricItem) => {
      setActiveItem(item);
      await loadJobs(item);
      showToast(`Monitoring item "${item.name}"`, 'success');
    },
    [loadJobs, showToast],
  );

  const addAndSelect = useCallback(
    async (item: FabricItem) => {
      setItems((prev) => [item, ...prev]);
      await selectItem(item);
    },
    [selectItem],
  );

  const refresh = useCallback(async () => {
    if (!activeItem) return showToast('Select an item to monitor first', 'warning');
    await loadJobs(activeItem);
    showToast('Refreshed job instances logs', 'info');
  }, [activeItem, loadJobs, showToast]);

  const loadNextPage = useCallback(async () => {
    if (!activeItem || !nextToken) return showToast('No more job instances', 'info');
    try {
      const page = await itemsApi.listJobs(activeItem.id, { continuationToken: nextToken });
      setJobs((prev) => [...prev, ...page.items]);
      setNextToken(page.continuationToken || null);
      showToast('Loaded additional job instances records', 'info');
    } catch (err) {
      showApiError(err, 'Could not load more jobs');
    }
  }, [activeItem, nextToken, showApiError, showToast]);

  return { items, loadItems, activeItem, jobs, selectItem, addAndSelect, refresh, loadNextPage };
}
