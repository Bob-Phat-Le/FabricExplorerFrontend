import type { FabricItemType } from '@/types/fabric';

/** A Fabric item the Query Editor can run a query against (what the item picker lists). */
export interface QueryTargetItem {
  id: string;
  name: string;
  type: FabricItemType;
  workspaceName: string | null;
}
