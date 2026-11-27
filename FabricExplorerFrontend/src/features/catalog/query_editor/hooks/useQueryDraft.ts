import { useCallback, useEffect, useRef, useState } from 'react';
import type { FabricItemType } from '@/types/fabric';
import type { QueryDraft } from '@/types/savedQuery/QueryDraft';
import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import { DEFAULT_MAX_ROWS } from '../constants';

/**
 * What the editor holds (SQL, Max Row, target item) plus the saved query it was loaded from, if any.
 * Switching connection drops the target and the link, since both belong to the previous connection.
 */
export function useQueryDraft(connectionId: string | undefined, initialSql: string) {
  const [sql, setSql] = useState(initialSql);
  const [maxRows, setMaxRows] = useState<number | null>(DEFAULT_MAX_ROWS);
  const [target, setTarget] = useState<QueryTargetItem | null>(null);
  const [loaded, setLoaded] = useState<SavedQuery | null>(null);

  const previousConnection = useRef(connectionId);
  useEffect(() => {
    if (previousConnection.current === connectionId) return;
    previousConnection.current = connectionId;
    setTarget(null);
    setLoaded(null);
  }, [connectionId]);

  /** `known` supplies the workspace name of the target when the item is among the listed ones. */
  const load = useCallback((query: SavedQuery, known: readonly QueryTargetItem[] = []) => {
    setSql(query.sql);
    setMaxRows(query.maxRows);
    setTarget(
      known.find((i) => i.id === query.target.itemId) ?? {
        id: query.target.itemId,
        name: query.target.itemName,
        type: query.target.itemType as FabricItemType,
        workspaceName: null,
      },
    );
    setLoaded(query);
  }, []);

  const clear = useCallback(() => {
    setSql('');
    setLoaded(null);
  }, []);

  const draft: QueryDraft = { sql, maxRows, target };

  return { draft, setSql, setMaxRows, setTarget, loaded, setLoaded, load, clear };
}
