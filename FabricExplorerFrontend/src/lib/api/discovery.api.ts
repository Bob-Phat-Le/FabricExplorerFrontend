import { call, ApiError } from './client';
import { mocks } from '../mocks/handlers';
import { asStreamed, openStream as openLiveStream, type StreamHandlers, type Streamed } from './stream';
import type {
  DiscoveryContext,
  Lakehouse,
  MirroredDatabaseDetails,
  MirroredDatabaseSummary,
  MirroringActionResult,
  MirroringStatus,
  TableMirroringStatus,
  TablePage,
  TablePageData,
  Warehouse,
  WarehouseConnectionString,
  WarehouseDetails,
  Workspace,
} from '@/types/discovery';

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && 'statusCode' in r && 'data' in r ? (r as { data: T }).data : r) as T;

const streamed = <T>(r: unknown): Streamed<T> => asStreamed<T>(unwrap<unknown>(r));

export const openStream = (live: Streamed<unknown>, handlers: StreamHandlers, { signal }: { signal?: AbortSignal } = {}) =>
  openLiveStream(live, handlers, { signal, mockPlayer: mocks.stream.play });

interface Opts {
  connectionId: string;
  refresh?: boolean;
  signal?: AbortSignal;
}

const opts = ({ connectionId, refresh = false, signal }: Opts) => ({
  headers: { 'X-Connection-Id': connectionId, ...(refresh ? { 'Cache-Control': 'no-cache' } : {}) },
  signal,
});

const lakehouses = (ws: string) => `/workspaces/${ws}/Lakehouses`;
const warehouses = (ws: string) => `/workspaces/${ws}/Warehouses`;
const mirroredDatabases = (ws: string) => `/workspaces/${ws}/MirroredDatabases`;

type MirroredTarget = DiscoveryContext & { mirroredDatabaseId: string };
const mdb = ({ workspaceId, mirroredDatabaseId }: { workspaceId: string; mirroredDatabaseId: string }) =>
  `${mirroredDatabases(workspaceId)}/${mirroredDatabaseId}`;

export const listWorkspaces = (ctx: DiscoveryContext) =>
  call<unknown>({ method: 'GET', path: '/Workspaces', ...opts(ctx) }, mocks.discovery.workspaces)
    .then((r) => unwrap<Workspace[]>(r))
    .catch((err) => {
      if (err instanceof ApiError && !err.code && (err.status === 404 || err.status === 405)) {
        throw new ApiError('Backend does not provide GET /api/Workspaces, so workspaces cannot be listed.', {
          status: err.status,
        });
      }
      throw err;
    });

export const listLakehouses = (ctx: DiscoveryContext) =>
  call<unknown>({ method: 'GET', path: lakehouses(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.lakehouses).then((r) =>
    unwrap<Lakehouse[]>(r),
  );

export const listLakehouseTables = ({
  workspaceId,
  lakehouseId,
  pageSize = 50,
  continuationToken,
  ...rest
}: DiscoveryContext & { lakehouseId: string; pageSize?: number; continuationToken?: string | null }): Promise<TablePage> =>
  call<unknown>(
    {
      method: 'GET',
      path: `${lakehouses(workspaceId)}/${lakehouseId}/tables`,
      query: { pageSize, continuationToken },
      ...opts(rest),
    },
    mocks.discovery.tables,
  ).then((r) => {
    const live = streamed<TablePageData>(r);
    return {
      items: live.data?.items ?? [],
      nextToken: live.data?.pageInformation?.nextToken ?? null,
      totalItems: live.data?.pageInformation?.totalItems ?? null,
      live,
    };
  });

export const listWarehouses = (ctx: DiscoveryContext) =>
  call<unknown>({ method: 'GET', path: warehouses(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.warehouses).then((r) =>
    unwrap<Warehouse[]>(r),
  );

export const getWarehouse = (ctx: DiscoveryContext & { warehouseId: string }) =>
  call<unknown>(
    { method: 'GET', path: `${warehouses(ctx.workspaceId)}/${ctx.warehouseId}`, ...opts(ctx) },
    mocks.discovery.warehouse,
  ).then((r) => streamed<WarehouseDetails>(r));

export const getWarehouseConnectionString = (ctx: DiscoveryContext & { warehouseId: string }) =>
  call<unknown>(
    { method: 'GET', path: `${warehouses(ctx.workspaceId)}/${ctx.warehouseId}/connection-string`, ...opts(ctx) },
    mocks.discovery.connString,
  ).then((r) => unwrap<WarehouseConnectionString>(r));

export const listMirroredDatabases = (ctx: DiscoveryContext) =>
  call<unknown>({ method: 'GET', path: mirroredDatabases(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.mirroredDbs).then(
    (r) => unwrap<MirroredDatabaseSummary[]>(r),
  );

export const getMirroredDb = (ctx: MirroredTarget) =>
  call<unknown>({ method: 'GET', path: mdb(ctx), ...opts(ctx) }, mocks.discovery.mirroredDb).then((r) =>
    streamed<MirroredDatabaseDetails>(r),
  );

export const getMirroringStatus = (ctx: MirroredTarget) =>
  call<unknown>({ method: 'GET', path: `${mdb(ctx)}/status`, ...opts(ctx) }, mocks.discovery.mirroringStatus).then((r) =>
    streamed<MirroringStatus>(r),
  );

export const startMirroring = (ctx: MirroredTarget) =>
  call<unknown>(
    { method: 'POST', path: `${mdb(ctx)}/start`, ...opts({ connectionId: ctx.connectionId }) },
    mocks.discovery.mirroringAction,
  ).then((r) => unwrap<MirroringActionResult>(r));

export const stopMirroring = (ctx: MirroredTarget) =>
  call<unknown>(
    { method: 'POST', path: `${mdb(ctx)}/stop`, ...opts({ connectionId: ctx.connectionId }) },
    mocks.discovery.mirroringAction,
  ).then((r) => unwrap<MirroringActionResult>(r));

export const getTablesMirroringStatus = (ctx: MirroredTarget) =>
  call<unknown>({ method: 'GET', path: `${mdb(ctx)}/tables/status`, ...opts(ctx) }, mocks.discovery.tablesStatus).then((r) =>
    unwrap<TableMirroringStatus[]>(r),
  );
