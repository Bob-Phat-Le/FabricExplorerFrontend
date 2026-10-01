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
    discovery: {
        tables: () => [],
        warehouse: () => ({}),
        connString: () => ({ connectionString: 'Data Source=sales_wh.pbidev.net;Initial Catalog=SalesWH;Integrate Security=True;' }),
        mirroredDb: () => ({}),
        mirroringStatus: () => ({ status: 'Running' }),
        tablesStatus: () => [],
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
