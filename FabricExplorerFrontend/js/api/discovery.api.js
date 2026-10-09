import { call, ApiError } from './client.js';
import { mocks } from '../mocks/handlers.js';

// Backend bọc mọi response trong ApiResponse<T> = { statusCode, data, errors }.
// Lỗi (errors[]) đã được client.js chuyển thành ApiError; ở đây chỉ bóc `data` khi thành công.
const unwrap = r => (r && typeof r === 'object' && 'statusCode' in r && 'data' in r ? r.data : r);

/**
 * Tùy chọn chung của mọi lời gọi (đi kèm các tham số riêng của từng hàm):
 *  - connectionId: gửi header X-Connection-Id (connection chỉ cấp tenant / client id / secret).
 *  - refresh:      true -> gửi `Cache-Control: no-cache`, backend bỏ qua cache cũ và ghi đè bằng dữ liệu mới
 *                  (nút Reload / Refresh). Mặc định dùng cache của backend.
 *  - signal:       AbortSignal; hủy request thì trình duyệt ngắt kết nối và backend dừng công việc đang làm.
 * Workspace KHÔNG lấy từ connection: gọi listWorkspaces() trước rồi truyền workspaceId của từng item vào các hàm bên dưới.
 */
const opts = ({ connectionId, refresh = false, signal }) => ({
    headers: { 'X-Connection-Id': connectionId, ...(refresh ? { 'Cache-Control': 'no-cache' } : {}) },
    signal,
});

// Đúng theo [Route("api/workspaces/{workspaceId}/[controller]")] của backend (baseUrl đã có /api).
const lakehouses = ws => `/workspaces/${ws}/Lakehouses`;
const warehouses = ws => `/workspaces/${ws}/Warehouses`;
const mirroredDatabases = ws => `/workspaces/${ws}/MirroredDatabases`;
const mdb = ({ workspaceId, mirroredDatabaseId }) => `${mirroredDatabases(workspaceId)}/${mirroredDatabaseId}`;

/* ───────────── Workspace ───────────── */

/**
 * GET /Workspaces  (WorkspacesController)
 * -> { workspaceId, workspaceName, capacityId }[]  — toàn bộ workspace trong tenant mà connection nhìn thấy.
 */
export const listWorkspaces = ctx =>
    call({ method: 'GET', path: '/Workspaces', ...opts(ctx) }, mocks.discovery.workspaces)
        .then(unwrap)
        .catch(err => {
            if (err instanceof ApiError && (err.status === 404 || err.status === 405)) {
                throw new ApiError('Backend does not provide GET /api/Workspaces, so workspaces cannot be listed.', { status: err.status });
            }
            throw err;
        });

/* ───────────── Lakehouse ───────────── */

/** GET /workspaces/:ws/Lakehouses -> { lakehouseId, lakehouseName, workspaceId, workspaceName, connectionId }[] */
export const listLakehouses = ctx =>
    call({ method: 'GET', path: lakehouses(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.lakehouses).then(unwrap);

/**
 * GET /workspaces/:ws/Lakehouses/:lakehouseId/tables?pageSize=&continuationToken=
 * -> { items: { name, type, format, location, rowCount, lastModifiedTime, status, statusMessage }[],
 *      pageInformation: { totalItems, pageSize, hasNextPage, nextToken } }
 * rowCount / lastModifiedTime / status được backend cache theo từng bảng (mặc định 60 giây); refresh:true để tính lại.
 */
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

/* ───────────── Warehouse ───────────── */

/** GET /workspaces/:ws/Warehouses -> { warehouseId, warehouseName, workspaceId, workspaceName, connectionId }[] */
export const listWarehouses = ctx =>
    call({ method: 'GET', path: warehouses(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.warehouses).then(unwrap);

/** GET /workspaces/:ws/Warehouses/:id -> { id, name, description, onlineStatus, onlineStatusMessage, workspace: { id, name, capacityId }, createdDate, lastUpdatedTime } */
export const getWarehouse = ctx =>
    call({ method: 'GET', path: `${warehouses(ctx.workspaceId)}/${ctx.warehouseId}`, ...opts(ctx) }, mocks.discovery.warehouse).then(unwrap);

/** GET /workspaces/:ws/Warehouses/:id/connection-string -> { warehouseId, connectionString, database } */
export const getWarehouseConnectionString = ctx =>
    call({ method: 'GET', path: `${warehouses(ctx.workspaceId)}/${ctx.warehouseId}/connection-string`, ...opts(ctx) }, mocks.discovery.connString).then(unwrap);

/* ───────────── Mirrored Database ───────────── */

/** GET /workspaces/:ws/MirroredDatabases -> { mirroredDatabaseId, mirroredDatabaseName, workspaceId, workspaceName, connectionId }[] (danh sách nhẹ cho dropdown) */
export const listMirroredDatabases = ctx =>
    call({ method: 'GET', path: mirroredDatabases(ctx.workspaceId), ...opts(ctx) }, mocks.discovery.mirroredDbs).then(unwrap);

/**
 * GET /workspaces/:ws/MirroredDatabases/:id
 * -> { mirroredDatabaseId, mirroredDatabaseName, workspaceId, workspaceName, sourceType, sourceName,
 *      createdAt (có thể null), status: 'Active'|'Offline'|'Unknown', mirroringStatus }
 */
export const getMirroredDb = ctx =>
    call({ method: 'GET', path: mdb(ctx), ...opts(ctx) }, mocks.discovery.mirroredDb).then(unwrap);

/** GET .../MirroredDatabases/:id/status -> { lastSynchronization, recordSynchronized, currentLatency (giây), status } */
export const getMirroringStatus = ctx =>
    call({ method: 'GET', path: `${mdb(ctx)}/status`, ...opts(ctx) }, mocks.discovery.mirroringStatus).then(unwrap);

/**
 * POST .../MirroredDatabases/:id/start -> { message, operationId }
 * Thao tác thay đổi trạng thái: KHÔNG truyền signal (backend cũng không hủy giữa chừng thao tác này).
 */
export const startMirroring = ctx =>
    call({ method: 'POST', path: `${mdb(ctx)}/start`, ...opts({ connectionId: ctx.connectionId }) }, mocks.discovery.mirroringAction).then(unwrap);

/** POST .../MirroredDatabases/:id/stop -> { message, operationId } (xem ghi chú ở startMirroring) */
export const stopMirroring = ctx =>
    call({ method: 'POST', path: `${mdb(ctx)}/stop`, ...opts({ connectionId: ctx.connectionId }) }, mocks.discovery.mirroringAction).then(unwrap);

/** GET .../MirroredDatabases/:id/tables/status -> { tableName, source, target, status, lastSync, lag (giây), processedRows }[] */
export const getTablesMirroringStatus = ctx =>
    call({ method: 'GET', path: `${mdb(ctx)}/tables/status`, ...opts(ctx) }, mocks.discovery.tablesStatus).then(unwrap);
