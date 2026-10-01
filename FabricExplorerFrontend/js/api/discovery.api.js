import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

// Tất cả nhận scope = { workspaceId } và gửi qua query string.
/** GET /discovery/lakehouse/tables -> Table[] */
export const listLakehouseTables = scope => call({ method: 'GET', path: '/discovery/lakehouse/tables', query: scope }, mocks.discovery.tables);
/** GET /discovery/warehouse -> Warehouse */
export const getWarehouse = scope => call({ method: 'GET', path: '/discovery/warehouse', query: scope }, mocks.discovery.warehouse);
/** GET /discovery/warehouse/connection-string -> { connectionString } */
export const getWarehouseConnectionString = scope => call({ method: 'GET', path: '/discovery/warehouse/connection-string', query: scope }, mocks.discovery.connString);
/** GET /discovery/mirrored-db -> MirroredDatabase */
export const getMirroredDb = scope => call({ method: 'GET', path: '/discovery/mirrored-db', query: scope }, mocks.discovery.mirroredDb);
/** GET /discovery/mirrored-db/status -> { status } */
export const getMirroringStatus = scope => call({ method: 'GET', path: '/discovery/mirrored-db/status', query: scope }, mocks.discovery.mirroringStatus);
/** POST /discovery/mirrored-db/start -> { ok } */
export const startMirroring = scope => call({ method: 'POST', path: '/discovery/mirrored-db/start', query: scope }, mocks.ok);
/** POST /discovery/mirrored-db/stop -> { ok } */
export const stopMirroring = scope => call({ method: 'POST', path: '/discovery/mirrored-db/stop', query: scope }, mocks.ok);
/** GET /discovery/mirrored-db/tables/status -> TableMirroringStatus[] */
export const getTablesMirroringStatus = scope => call({ method: 'GET', path: '/discovery/mirrored-db/tables/status', query: scope }, mocks.discovery.tablesStatus);
