import { call, ApiError } from './client.js';
import { mocks } from '../mocks/handlers.js';

const unwrap = r => (r && typeof r === 'object' && 'statusCode' in r && 'data' in r ? r.data : r);

const opts = ({ connectionId, refresh = false, signal }) => ({
    headers: { 'X-Connection-Id': connectionId, ...(refresh ? { 'Cache-Control': 'no-cache' } : {}) },
    signal,
});

const lakehouses = ws => `/workspaces/${ws}/Lakehouses`;
const warehouses = ws => `/workspaces/${ws}/Warehouses`;
const mirroredDatabases = ws => `/workspaces/${ws}/MirroredDatabases`;
const mdb = ({ workspaceId, mirroredDatabaseId }) => `${mirroredDatabases(workspaceId)}/${mirroredDatabaseId}`;

export const listWorkspaces = ctx =>
    call({ method: 'GET', path: '/Workspaces', ...opts(ctx) }, mocks.discovery.workspaces)
        .then(unwrap)
        .catch(err => {
            if (err instanceof ApiError && !err.code && (err.status === 404 || err.status === 405)) {
                throw new ApiError('Backend does not provide GET /api/Workspaces, so workspaces cannot be listed.', { status: err.status });
            }
            throw err;
        });

export const listLakehouses = ctx =>
    call({ method: 'GET', path: lakehouses(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.lakehouses).then(unwrap);

export const listLakehouseTables = ({ workspaceId, lakehouseId, pageSize = 50, continuationToken, ...rest }) =>
    call({
        method: 'GET',
        path: `${lakehouses(workspaceId)}/${lakehouseId}/tables`,
        query: { pageSize, continuationToken },
        ...opts(rest),
    }, mocks.discovery.tables)
        .then(unwrap)
        .then(page => ({
            items: page?.items ?? [],
            nextToken: page?.pageInformation?.nextToken ?? null,
            totalItems: page?.pageInformation?.totalItems ?? null,
        }));

export const listWarehouses = ctx =>
    call({ method: 'GET', path: warehouses(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.warehouses).then(unwrap);

export const getWarehouse = ctx =>
    call({ method: 'GET', path: `${warehouses(ctx.workspaceId)}/${ctx.warehouseId}`, ...opts(ctx) }, mocks.discovery.warehouse).then(unwrap);

export const getWarehouseConnectionString = ctx =>
    call({ method: 'GET', path: `${warehouses(ctx.workspaceId)}/${ctx.warehouseId}/connection-string`, ...opts(ctx) }, mocks.discovery.connString).then(unwrap);

export const listMirroredDatabases = ctx =>
    call({ method: 'GET', path: mirroredDatabases(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.mirroredDbs).then(unwrap);

export const getMirroredDb = ctx =>
    call({ method: 'GET', path: mdb(ctx), ...opts(ctx) }, mocks.discovery.mirroredDb).then(unwrap);

export const getMirroringStatus = ctx =>
    call({ method: 'GET', path: `${mdb(ctx)}/status`, ...opts(ctx) }, mocks.discovery.mirroringStatus).then(unwrap);

export const startMirroring = ctx =>
    call({ method: 'POST', path: `${mdb(ctx)}/start`, ...opts({ connectionId: ctx.connectionId }) }, mocks.discovery.mirroringAction).then(unwrap);

export const stopMirroring = ctx =>
    call({ method: 'POST', path: `${mdb(ctx)}/stop`, ...opts({ connectionId: ctx.connectionId }) }, mocks.discovery.mirroringAction).then(unwrap);

export const getTablesMirroringStatus = ctx =>
    call({ method: 'GET', path: `${mdb(ctx)}/tables/status`, ...opts(ctx) }, mocks.discovery.tablesStatus).then(unwrap);
