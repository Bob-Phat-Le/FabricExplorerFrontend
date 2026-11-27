import * as discoveryApi from '@/lib/api/discovery.api';
import type { FabricItemType } from '@/types/fabric';
import type { TargetSource } from './TargetSource';

/**
 * Registry of the item kinds a query can run against. Adding a kind is one entry here:
 * the picker, its filter chips and the saved-query list all read from this registry.
 */
export const TARGET_SOURCES: Readonly<Record<FabricItemType, TargetSource>> = {
  Lakehouse: {
    type: 'Lakehouse',
    label: 'Lakehouse',
    chip: 'Lakehouse',
    icon: 'fa-building-columns',
    fetch: async (ctx) =>
      ((await discoveryApi.listLakehouses(ctx)) ?? []).map((i) => ({
        id: i.lakehouseId,
        name: i.lakehouseName,
        type: 'Lakehouse',
        workspaceName: i.workspaceName ?? null,
      })),
  },
  Warehouse: {
    type: 'Warehouse',
    label: 'Warehouse',
    chip: 'Warehouse',
    icon: 'fa-warehouse',
    fetch: async (ctx) =>
      ((await discoveryApi.listWarehouses(ctx)) ?? []).map((i) => ({
        id: i.warehouseId,
        name: i.warehouseName,
        type: 'Warehouse',
        workspaceName: i.workspaceName ?? null,
      })),
  },
  MirroredDatabase: {
    type: 'MirroredDatabase',
    label: 'Mirrored Database',
    chip: 'Mirrored DB',
    icon: 'fa-arrows-rotate',
    fetch: async (ctx) =>
      ((await discoveryApi.listMirroredDatabases(ctx)) ?? []).map((i) => ({
        id: i.mirroredDatabaseId,
        name: i.mirroredDatabaseName,
        type: 'MirroredDatabase',
        workspaceName: i.workspaceName ?? null,
      })),
  },
};

export const TARGET_SOURCE_LIST: readonly TargetSource[] = Object.values(TARGET_SOURCES);

export const FALLBACK_ICON = 'fa-cube';

/** Saved queries carry the item type as a plain string, so the lookup tolerates unknown values. */
export const targetIconOf = (itemType: string) => TARGET_SOURCES[itemType as FabricItemType]?.icon ?? FALLBACK_ICON;
export const targetLabelOf = (itemType: string) => TARGET_SOURCES[itemType as FabricItemType]?.label ?? itemType;
