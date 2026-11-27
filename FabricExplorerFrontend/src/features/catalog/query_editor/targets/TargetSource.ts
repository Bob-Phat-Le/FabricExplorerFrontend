import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import type { DiscoveryContext } from '@/types/discovery';
import type { FabricItemType } from '@/types/fabric';

/** Strategy: how one kind of Fabric item is listed and presented in the target picker. */
export interface TargetSource {
  type: FabricItemType;
  /** e.g. "Mirrored Database" */
  label: string;
  /** Short label for filter chips, e.g. "Mirrored DB" */
  chip: string;
  /** Font Awesome icon (without the `fa-solid` prefix) */
  icon: string;
  fetch: (ctx: DiscoveryContext) => Promise<QueryTargetItem[]>;
}
