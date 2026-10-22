import { ApiError, sleep } from '../api/client.js';
import * as seeds from './seeds.js';

const ok = () => ({ ok: true });

// ---- Mô phỏng SSE: endpoint trả EventStreamingAdapter, sự kiện được "phát" theo lịch khi openStream được gọi ----
const mockStreams = new Map();

function streamed(innerData, pendingFields, events) {
    const streamId = `mock-${crypto.randomUUID()}`;
    mockStreams.set(streamId, events);
    return { isEventStreaming: true, streamId, pendingFields, innerData };
}

const checkingRow = (row) => ({ ...row, rowCount: null, lastModifiedTime: null, status: 'Checking', statusMessage: null });

export const mocks = {
    ok,
    list: () => [],
    connections: {
        list: () => seeds.connections,
        get: req => seeds.connections.find(c => c.id === req.path.split('/')[2]),
        getActive: () => seeds.connections.find(c => c.isActive) ?? null,
        save: req => {
            const { clientSecret, ...rest } = req.body;
            const conn = { id: `conn-${Date.now()}`, workspaceName: rest.workspaceId, environment: 'Production', isActive: false, ...rest };
            seeds.connections.push(conn);
            return conn;
        },
        update: req => {
            const id = req.path.split('/')[2];
            const { clientSecret, ...rest } = req.body;
            const conn = seeds.connections.find(c => c.id === id);
            Object.assign(conn, rest);
            return conn;
        },
        activate: req => {
            const id = req.path.split('/')[2];
            seeds.connections.forEach(c => { c.isActive = c.id === id; });
            return ok();
        },
    },
    discovery: {
        workspaces: () => seeds.workspaces,
        lakehouses: () => seeds.lakehouses,
        // Customers đã có trong cache (trả ngay); Orders/Staging phải tính nên "Checking" rồi đến qua stream
        tables: () => streamed({
            items: [
                { name: 'Customers', type: 'Managed', format: 'delta', location: 'Tables/Customers', rowCount: 125420, lastModifiedTime: new Date(Date.now() - 2 * 60e3).toISOString(), status: 'Healthy', statusMessage: null },
                checkingRow({ name: 'Orders', type: 'Managed', format: 'delta', location: 'Tables/Orders' }),
                checkingRow({ name: 'Staging', type: 'Managed', format: 'delta', location: 'Tables/Staging' }),
            ],
            pageInformation: { totalItems: 3, pageSize: 50, hasNextPage: false, nextToken: null },
        }, ['rowCount', 'lastModifiedTime', 'status', 'statusMessage'], [
            { delayMs: 900, name: 'table-stats', data: { name: 'Orders', rowCount: 842301, lastModifiedTime: new Date(Date.now() - 5 * 60e3).toISOString(), status: 'Healthy', statusMessage: null } },
            { delayMs: 900, name: 'table-stats', data: { name: 'Staging', rowCount: 0, lastModifiedTime: null, status: 'Empty', statusMessage: 'Table has no rows.' } },
        ]),
        warehouses: () => seeds.warehouses,
        warehouse: () => streamed({
            id: seeds.warehouses[0].warehouseId, name: 'Sales Warehouse', description: null,
            onlineStatus: 'Checking', onlineStatusMessage: null,
            workspace: { id: seeds.warehouses[0].workspaceId, name: 'Production Analytics', capacityId: null },
            createdDate: '2026-01-12T08:00:00Z', lastUpdatedTime: new Date().toISOString(),
        }, ['onlineStatus', 'onlineStatusMessage'], [
            { delayMs: 1500, name: 'online-status', data: { onlineStatus: 'Online', onlineStatusMessage: null } },
        ]),
        connString: () => ({ warehouseId: seeds.warehouses[0].warehouseId, connectionString: 'abc123.datawarehouse.fabric.microsoft.com', database: 'SalesWH' }),
        mirroredDbs: () => seeds.mirroredDbs,
        mirroredDb: () => streamed(
            { ...seeds.mirroredDbs[0], status: 'Checking', mirroringStatus: 'Checking', sourceType: 'Checking', sourceName: 'Checking' },
            ['mirroringStatus', 'status', 'sourceType', 'sourceName'],
            [
                { delayMs: 800, name: 'mirroring-status', data: { mirroringStatus: 'Running', status: 'Active' } },
                { delayMs: 700, name: 'source-info', data: { sourceType: seeds.mirroredDbs[0].sourceType, sourceName: seeds.mirroredDbs[0].sourceName } },
            ]),
        mirroringStatus: () => streamed(
            { lastSynchronization: null, recordSynchronized: 0, currentLatency: null, status: 'Running' },
            ['lastSynchronization', 'recordSynchronized', 'currentLatency'],
            [{ delayMs: 1200, name: 'mirroring-metrics', data: { lastSynchronization: new Date(Date.now() - 2 * 60e3).toISOString(), recordSynchronized: 1248392, currentLatency: 18 } }]),
        mirroringAction: () => ({ message: 'Mirroring request accepted.', operationId: null }),
        tablesStatus: () => [
            { tableName: 'Customers', source: 'dbo.Customers', target: 'dbo.Customers', status: 'Replicating', lastSync: new Date(Date.now() - 60e3).toISOString(), lag: 3, processedRows: 125420 },
            { tableName: 'Orders', source: 'dbo.Orders', target: 'dbo.Orders', status: 'Snapshotting', lastSync: new Date().toISOString(), lag: 12, processedRows: 842301 },
            { tableName: 'Products', source: 'dbo.Products', target: 'dbo.Products', status: 'Failed', lastSync: new Date(Date.now() - 8 * 60e3).toISOString(), lag: 120, processedRows: 24820 },
        ],
    },
    stream: {
        /** Phát các sự kiện đã lên lịch của stream (mô phỏng GET /event-streams/:id), kết thúc bằng completed. */
        play: async (streamId, dispatch, signal) => {
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
        submit: req => {
            if (req.meta?.simulateOutcome && req.meta.simulateOutcome !== 'success') {
                throw new ApiError('Ingestion failed during table load step', { status: 500 });
            }
            return { jobId: crypto.randomUUID(), status: 'Completed' };
        },
    },
    replication: { start: () => ({ id: crypto.randomUUID(), status: 'Running' }) },
    items: {
        list: () => seeds.items,
        create: async req => {
            await sleep(1400);
            return {
                id: `${Math.random().toString(36).substring(2, 10)}-abcd-4c02-8ccd-6faef5ba1bd7`,
                name: req.body.displayName, type: req.body.type, workspace: 'Production Analytics',
            };
        },
        jobs: () => ({ items: seeds.jobs, continuationToken: null }),
        job: req => seeds.jobs.find(j => req.path.endsWith(j.id)),
    },
};
