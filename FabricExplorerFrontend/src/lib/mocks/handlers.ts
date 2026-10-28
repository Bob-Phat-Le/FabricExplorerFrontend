import { ApiError, sleep, type RequestOptions } from '../api/client';
import type { StreamDispatch } from '../api/stream';
import type { Connection, ConnectionPayload } from '@/types/connection';
import type { CreateItemPayload, FabricItem } from '@/types/fabric';
import type { IngestionResult } from '@/types/ingestion';
import type { ReplicationResult } from '@/types/replication';
import type { LakehouseTable } from '@/types/discovery';
import * as seeds from './seeds';

const ok = () => ({ ok: true });

interface ScheduledEvent {
  delayMs: number;
  name: string;
  data: unknown;
}

const mockStreams = new Map<string, ScheduledEvent[]>();

function streamed<T>(innerData: T, pendingFields: string[], events: ScheduledEvent[]) {
  const streamId = `mock-${crypto.randomUUID()}`;
  mockStreams.set(streamId, events);
  return { isEventStreaming: true, streamId, pendingFields, innerData };
}

const checkingRow = (row: Pick<LakehouseTable, 'name' | 'type' | 'format' | 'location'>): LakehouseTable => ({
  ...row,
  rowCount: null,
  lastModifiedTime: null,
  status: 'Checking',
  statusMessage: null,
});

const idFromPath = (req: RequestOptions) => req.path.split('/')[2];

export const mocks = {
  ok,
  list: () => [] as unknown[],
  connections: {
    list: () => seeds.connections,
    get: (req: RequestOptions) => seeds.connections.find((c) => c.id === idFromPath(req)),
    getActive: () => seeds.connections.find((c) => c.isActive) ?? null,
    save: (req: RequestOptions): Connection => {
      const rest = { ...(req.body as ConnectionPayload) };
      delete rest.clientSecret;
      const conn: Connection = {
        id: `conn-${Date.now()}`,
        workspaceName: rest.workspaceId,
        environment: 'Production',
        isActive: false,
        ...rest,
      };
      seeds.connections.push(conn);
      return conn;
    },
    update: (req: RequestOptions) => {
      const rest = { ...(req.body as ConnectionPayload) };
      delete rest.clientSecret;
      const conn = seeds.connections.find((c) => c.id === idFromPath(req));
      if (conn) Object.assign(conn, rest);
      return conn;
    },
    activate: (req: RequestOptions) => {
      const id = idFromPath(req);
      seeds.connections.forEach((c) => {
        c.isActive = c.id === id;
      });
      return ok();
    },
  },
  discovery: {
    workspaces: () => seeds.workspaces,
    lakehouses: () => seeds.lakehouses,
    tables: () =>
      streamed(
        {
          items: [
            { name: 'Customers', type: 'Managed', format: 'delta', location: 'Tables/Customers', rowCount: 125420, lastModifiedTime: new Date(Date.now() - 2 * 60e3).toISOString(), status: 'Healthy', statusMessage: null } as LakehouseTable,
            checkingRow({ name: 'Orders', type: 'Managed', format: 'delta', location: 'Tables/Orders' }),
            checkingRow({ name: 'Staging', type: 'Managed', format: 'delta', location: 'Tables/Staging' }),
          ],
          pageInformation: { totalItems: 3, pageSize: 50, hasNextPage: false, nextToken: null },
        },
        ['rowCount', 'lastModifiedTime', 'status', 'statusMessage'],
        [
          { delayMs: 900, name: 'table-stats', data: { name: 'Orders', rowCount: 842301, lastModifiedTime: new Date(Date.now() - 5 * 60e3).toISOString(), status: 'Healthy', statusMessage: null } },
          { delayMs: 900, name: 'table-stats', data: { name: 'Staging', rowCount: 0, lastModifiedTime: null, status: 'Empty', statusMessage: 'Table has no rows.' } },
        ],
      ),
    warehouses: () => seeds.warehouses,
    warehouse: () =>
      streamed(
        {
          id: seeds.warehouses[0].warehouseId,
          name: 'Sales Warehouse',
          description: null,
          onlineStatus: 'Checking',
          onlineStatusMessage: null,
          workspace: { id: seeds.warehouses[0].workspaceId, name: 'Production Analytics', capacityId: null },
          createdDate: '2026-01-12T08:00:00Z',
          lastUpdatedTime: new Date().toISOString(),
        },
        ['onlineStatus', 'onlineStatusMessage'],
        [{ delayMs: 1500, name: 'online-status', data: { onlineStatus: 'Online', onlineStatusMessage: null } }],
      ),
    connString: () => ({
      warehouseId: seeds.warehouses[0].warehouseId,
      connectionString: 'abc123.datawarehouse.fabric.microsoft.com',
      database: 'SalesWH',
    }),
    mirroredDbs: () => seeds.mirroredDbs,
    mirroredDb: () =>
      streamed(
        { ...seeds.mirroredDbs[0], status: 'Checking', mirroringStatus: 'Checking', sourceType: 'Checking', sourceName: 'Checking' },
        ['mirroringStatus', 'status', 'sourceType', 'sourceName'],
        [
          { delayMs: 800, name: 'mirroring-status', data: { mirroringStatus: 'Running', status: 'Active' } },
          { delayMs: 700, name: 'source-info', data: { sourceType: seeds.mirroredDbs[0].sourceType, sourceName: seeds.mirroredDbs[0].sourceName } },
        ],
      ),
    mirroringStatus: () =>
      streamed(
        { lastSynchronization: null, recordSynchronized: 0, currentLatency: null, status: 'Running' },
        ['lastSynchronization', 'recordSynchronized', 'currentLatency'],
        [{ delayMs: 1200, name: 'mirroring-metrics', data: { lastSynchronization: new Date(Date.now() - 2 * 60e3).toISOString(), recordSynchronized: 1248392, currentLatency: 18 } }],
      ),
    mirroringAction: () => ({ message: 'Mirroring request accepted.', operationId: null }),
    tablesStatus: () => [
      { tableName: 'Customers', source: 'dbo.Customers', target: 'dbo.Customers', status: 'Replicating', lastSync: new Date(Date.now() - 60e3).toISOString(), lag: 3, processedRows: 125420 },
      { tableName: 'Orders', source: 'dbo.Orders', target: 'dbo.Orders', status: 'Snapshotting', lastSync: new Date().toISOString(), lag: 12, processedRows: 842301 },
      { tableName: 'Products', source: 'dbo.Products', target: 'dbo.Products', status: 'Failed', lastSync: new Date(Date.now() - 8 * 60e3).toISOString(), lag: 120, processedRows: 24820 },
    ],
  },
  stream: {
    play: async (streamId: string, dispatch: StreamDispatch, signal?: AbortSignal) => {
      const events = mockStreams.get(streamId) ?? [];
      for (const { delayMs, name, data } of events) {
        await sleep(delayMs);
        if (signal?.aborted) throw new ApiError('Request cancelled', { code: 'ABORTED' });
        if (dispatch(name, data)) break;
      }
      mockStreams.delete(streamId);
      dispatch('completed', '{}');
    },
  },
  ingestion: {
    submit: (req: RequestOptions): IngestionResult => {
      const outcome = req.meta?.simulateOutcome;
      if (outcome && outcome !== 'success') {
        throw new ApiError('Ingestion failed during table load step', { status: 500 });
      }
      return { jobId: crypto.randomUUID(), status: 'Completed' };
    },
  },
  replication: {
    start: (): ReplicationResult => ({ id: crypto.randomUUID(), status: 'Running' }),
  },
  items: {
    list: () => seeds.items,
    create: async (req: RequestOptions): Promise<FabricItem> => {
      await sleep(1400);
      const body = req.body as CreateItemPayload;
      return {
        id: `${Math.random().toString(36).substring(2, 10)}-abcd-4c02-8ccd-6faef5ba1bd7`,
        name: body.displayName,
        type: body.type,
        workspace: 'Production Analytics',
      };
    },
    jobs: () => ({ items: seeds.jobs, continuationToken: null as string | null }),
    job: (req: RequestOptions) => seeds.jobs.find((j) => req.path.endsWith(j.id)),
  },
};
