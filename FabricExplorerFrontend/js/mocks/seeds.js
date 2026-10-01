// Dữ liệu mẫu cũ (trước đây nằm cứng trong file god). Chỉ dùng khi API_CONFIG.useMock = true.
export const connections = [
    {
        id: 'conn-1',
        name: 'Production Fabric',
        workspaceName: 'Production Analytics',
        workspaceId: '12345678-abcd-1234-abcd-1234567890ab',
        tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
        clientId: '8f3e1a2b-9c4d-4e5f-8a1b-3c5d7e9f2a4b',
        environment: 'Production',
        isActive: true
    },
    {
        id: 'conn-2',
        name: 'Staging Fabric Environment',
        workspaceName: 'Staging Analytics',
        workspaceId: '87654321-abcd-4321-abcd-0987654321ba',
        tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
        clientId: '3a2b1c4d-8e7f-6a5b-4c3d-2e1f0a9b8c7d',
        environment: 'Staging',
        isActive: false
    }
];

export const items = [
    { id: '431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7', name: 'Sales Analytics Lakehouse', type: 'Lakehouse', workspace: 'Production Analytics' },
    { id: '9c6c8d7b-1a2b-3c4d-5e6f-7a8b9c0d1e2f', name: 'Sales Warehouse', type: 'Warehouse', workspace: 'Production Analytics' },
    { id: '8a421e3f-9b8c-7d6e-5f4a-3b2c1d0e9f8a', name: 'Customer Mirror DB', type: 'MirroredDatabase', workspace: 'Production Analytics' }
];

export const jobs = [
    { id: 'f2d65699-dd22-4889-980c-15226deb0e1b', jobType: 'DefaultJob', invokeType: 'Manual', status: 'Completed', startTime: '2026-03-15T13:35:00.000Z', endTime: '2026-03-15T13:35:00.000Z', rootActivityId: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d' },
    { id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', jobType: 'DataPipeline', invokeType: 'Scheduled', status: 'InProgress', startTime: '2026-03-15T14:18:20.000Z', endTime: null, rootActivityId: '9b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e' },
    { id: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', jobType: 'NotebookJob', invokeType: 'Manual', status: 'Failed', startTime: '2026-03-15T12:10:00.000Z', endTime: '2026-03-15T12:12:15.000Z', rootActivityId: '0c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f', errorMsg: 'ErrorCode: SchemaTypeConflictException - Target table schema mismatch.' },
    { id: '3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e', jobType: 'DefaultJob', invokeType: 'Scheduled', status: 'Deduped', startTime: '2026-03-15T11:00:00.000Z', endTime: '2026-03-15T11:00:00.000Z', rootActivityId: '1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a' }
];
