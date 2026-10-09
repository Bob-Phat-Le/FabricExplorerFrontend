// Mock cho từng endpoint, dùng khi API_CONFIG.useMock = true. Xoá thư mục mocks/ khi backend đã đủ.
import { ApiError, sleep } from '../api/client.js';
import * as seeds from './seeds.js';

const ok = () => ({ ok: true });

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
    // Dữ liệu mẫu có cùng hình dạng với response thật của backend (sau khi api layer bóc `data`).
    discovery: {
        workspaces: () => seeds.workspaces,
        lakehouses: () => seeds.lakehouses,
        tables: () => ({
            items: [
                { name: 'Customers', type: 'Managed', format: 'delta', location: 'Tables/Customers', rowCount: 125420, lastModifiedTime: new Date(Date.now() - 2 * 60e3).toISOString(), status: 'Healthy', statusMessage: null },
                { name: 'Orders', type: 'Managed', format: 'delta', location: 'Tables/Orders', rowCount: 842301, lastModifiedTime: new Date(Date.now() - 5 * 60e3).toISOString(), status: 'Healthy', statusMessage: null },
                { name: 'Staging', type: 'Managed', format: 'delta', location: 'Tables/Staging', rowCount: 0, lastModifiedTime: null, status: 'Empty', statusMessage: 'Table has no rows.' },
            ],
            pageInformation: { totalItems: 3, pageSize: 50, hasNextPage: false, nextToken: null },
        }),
        warehouses: () => seeds.warehouses,
        warehouse: () => ({
            id: seeds.warehouses[0].warehouseId, name: 'Sales Warehouse', description: null,
            onlineStatus: 'Online', onlineStatusMessage: null,
            workspace: { id: seeds.warehouses[0].workspaceId, name: 'Production Analytics', capacityId: null },
            createdDate: '2026-01-12T08:00:00Z', lastUpdatedTime: new Date().toISOString(),
        }),
        connString: () => ({ warehouseId: seeds.warehouses[0].warehouseId, connectionString: 'abc123.datawarehouse.fabric.microsoft.com', database: 'SalesWH' }),
        mirroredDbs: () => seeds.mirroredDbs,
        mirroredDb: () => seeds.mirroredDbs[0],
        mirroringStatus: () => ({ lastSynchronization: new Date(Date.now() - 2 * 60e3).toISOString(), recordSynchronized: 1248392, currentLatency: 18, status: 'Running' }),
        mirroringAction: () => ({ message: 'Mirroring request accepted.', operationId: null }),
        tablesStatus: () => [
            { tableName: 'Customers', source: 'dbo.Customers', target: 'dbo.Customers', status: 'Replicating', lastSync: new Date(Date.now() - 60e3).toISOString(), lag: 3, processedRows: 125420 },
            { tableName: 'Orders', source: 'dbo.Orders', target: 'dbo.Orders', status: 'Snapshotting', lastSync: new Date().toISOString(), lag: 12, processedRows: 842301 },
            { tableName: 'Products', source: 'dbo.Products', target: 'dbo.Products', status: 'Failed', lastSync: new Date(Date.now() - 8 * 60e3).toISOString(), lag: 120, processedRows: 24820 },
        ],
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
            await sleep(1400);   // giả lập thời gian provision như bản cũ (1.8s tổng)
            return {
                id: `${Math.random().toString(36).substring(2, 10)}-abcd-4c02-8ccd-6faef5ba1bd7`,
                name: req.body.displayName, type: req.body.type, workspace: 'Production Analytics',
            };
        },
        jobs: () => ({ items: seeds.jobs, continuationToken: null }),
        job: req => seeds.jobs.find(j => req.path.endsWith(j.id)),
    },
};
