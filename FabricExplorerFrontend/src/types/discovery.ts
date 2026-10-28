export interface DiscoveryContext {
  connectionId: string;
  workspaceId: string;
  /** true -> send `Cache-Control: no-cache` */
  refresh?: boolean;
  signal?: AbortSignal;
}

interface WorkspaceScoped {
  workspaceId: string;
  workspaceName?: string | null;
  connectionId?: string;
}

export interface Workspace {
  workspaceId: string;
  workspaceName: string;
  capacityId: string | null;
}

export interface Lakehouse extends WorkspaceScoped {
  lakehouseId: string;
  lakehouseName: string;
}

export interface Warehouse extends WorkspaceScoped {
  warehouseId: string;
  warehouseName: string;
}

export interface MirroredDatabaseSummary extends WorkspaceScoped {
  mirroredDatabaseId: string;
  mirroredDatabaseName: string;
  sourceType: string | null;
  sourceName: string | null;
  createdAt: string | null;
  status: string;
  mirroringStatus: string;
}

/** status: Healthy | Empty | Stale | Error | Unknown | "Checking" (waiting for SSE `table-stats`) */
export interface LakehouseTable {
  name: string;
  type?: string;
  format?: string;
  location?: string;
  rowCount: number | null;
  lastModifiedTime: string | null;
  status: string;
  statusMessage: string | null;
}

export interface TablePageData {
  items: LakehouseTable[];
  pageInformation?: {
    totalItems?: number | null;
    pageSize?: number;
    hasNextPage?: boolean;
    nextToken?: string | null;
  };
}

export interface TablePage {
  items: LakehouseTable[];
  nextToken: string | null;
  totalItems: number | null;
  live: import('@/lib/api/stream').Streamed<TablePageData>;
}

export interface WarehouseDetails {
  id: string;
  name: string;
  description: string | null;
  onlineStatus: string;
  onlineStatusMessage: string | null;
  workspace: { id: string; name: string; capacityId: string | null };
  createdDate: string | null;
  lastUpdatedTime: string | null;
}

export interface WarehouseConnectionString {
  warehouseId?: string;
  connectionString: string;
  database: string;
}

export type MirroredDatabaseDetails = MirroredDatabaseSummary;

export interface MirroringStatus {
  lastSynchronization: string | null;
  recordSynchronized: number | null;
  currentLatency: number | null;
  status: string;
}

export interface TableMirroringStatus {
  tableName: string;
  source: string;
  target: string;
  status: string;
  lastSync: string | null;
  lag: number | null;
  processedRows?: number;
}

export interface MirroringActionResult {
  message?: string;
  operationId?: string | null;
}

/** Payload for SSE events: field name match DTO so just need to merge into DTO*/
export type TableStatsPatch = Partial<LakehouseTable> & { name: string };
export type WarehouseStatusPatch = Pick<WarehouseDetails, 'onlineStatus' | 'onlineStatusMessage'>;
export type MirroringStatusPatch = Partial<Pick<MirroredDatabaseDetails, 'mirroringStatus' | 'status'>>;
export type SourceInfoPatch = Partial<Pick<MirroredDatabaseDetails, 'sourceType' | 'sourceName'>>;
export type MirroringMetricsPatch = Partial<Pick<MirroringStatus, 'lastSynchronization' | 'recordSynchronized' | 'currentLatency'>>;
