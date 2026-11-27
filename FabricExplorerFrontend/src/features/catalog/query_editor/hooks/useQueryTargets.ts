import { useCallback, useEffect, useState } from 'react';
import { useDiscoveryContext } from '@/features/discovery/hooks/useDiscoveryContext';
import { useRequestGuard } from '@/features/discovery/hooks/useRequestGuard';
import type { LoadState } from '@/features/catalog/table/hooks/useCatalogTables';
import { useToast } from '@/providers/ToastProvider';
import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import { TARGET_SOURCE_LIST } from '../targets/targetSources';

/**
 * Lakehouses, warehouses and mirrored databases of the active connection: the items a query can run against.
 * Each kind is loaded by its own source; one failing kind does not hide the others.
 */
export function useQueryTargets() {
  const { ctx } = useDiscoveryContext();
  const { showToast, showApiError } = useToast();
  const { latest, invalidate } = useRequestGuard();

  const [items, setItems] = useState<QueryTargetItem[]>([]);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);

  const connectionId = ctx?.connectionId;
  const workspaceId = ctx?.workspaceId;

  const load = useCallback(
    async (refresh = false) => {
      if (connectionId === undefined || workspaceId === undefined) {
        invalidate('targets');
        setItems([]);
        setState('idle');
        setError(null);
        return;
      }

      const isCurrent = latest('targets');
      setState('loading');
      setError(null);

      const settled = await Promise.allSettled(
        TARGET_SOURCE_LIST.map((source) => source.fetch({ connectionId, workspaceId, refresh, signal: isCurrent.signal })),
      );
      if (!isCurrent()) return;

      const failed = settled.flatMap((r, i) => (r.status === 'rejected' ? [{ source: TARGET_SOURCE_LIST[i], reason: r.reason as unknown }] : []));
      const loaded = settled.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

      setItems(loaded);

      if (failed.length === TARGET_SOURCE_LIST.length) {
        setState('error');
        setError(failed[0].reason instanceof Error ? failed[0].reason.message : 'Could not load Fabric items');
        showApiError(failed[0].reason, 'Could not load Fabric items');
        return;
      }

      setState('ready');
      if (failed.length > 0) showToast(`Could not load: ${failed.map((f) => f.source.label).join(', ')}.`, 'warning');
    },
    [connectionId, workspaceId, latest, invalidate, showToast, showApiError],
  );

  useEffect(() => {
    void load();
  }, [load]);

  return { hasConnection: ctx !== null, items, state, error, reload: () => load(true) };
}
