import type { Connection } from '@/types/connection';
import type { FabricItem, JobInstance } from '@/types/fabric';
import type { Lakehouse, MirroredDatabaseSummary, Warehouse, Workspace } from '@/types/discovery';
import type { Notification } from '@/types/notification';
import type { CatalogColumn, CatalogTableDetail, CatalogTree } from '@/types/catalog';

export const connections: Connection[] = [
  {
    id: 'conn-1',
    name: 'Production Fabric',
    workspaceName: 'Production Analytics',
    workspaceId: '12345678-abcd-1234-abcd-1234567890ab',
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    clientId: '8f3e1a2b-9c4d-4e5f-8a1b-3c5d7e9f2a4b',
    environment: 'Production',
    isActive: true,
  },
  {
    id: 'conn-2',
    name: 'Staging Fabric Environment',
    workspaceName: 'Staging Analytics',
    workspaceId: '87654321-abcd-4321-abcd-0987654321ba',
    tenantId: '72f988bf-86f1-41af-91ab-2d7cd011db47',
    clientId: '3a2b1c4d-8e7f-6a5b-4c3d-2e1f0a9b8c7d',
    environment: 'Staging',
    isActive: false,
  },
];

export const items: FabricItem[] = [
  { id: '431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7', name: 'Sales Analytics Lakehouse', type: 'Lakehouse', workspace: 'Production Analytics' },
  { id: '9c6c8d7b-1a2b-3c4d-5e6f-7a8b9c0d1e2f', name: 'Sales Warehouse', type: 'Warehouse', workspace: 'Production Analytics' },
  { id: '8a421e3f-9b8c-7d6e-5f4a-3b2c1d0e9f8a', name: 'Customer Mirror DB', type: 'MirroredDatabase', workspace: 'Production Analytics' },
];

export const jobs: JobInstance[] = [
  { id: 'f2d65699-dd22-4889-980c-15226deb0e1b', jobType: 'DefaultJob', invokeType: 'Manual', status: 'Completed', startTime: '2026-03-15T13:35:00.000Z', endTime: '2026-03-15T13:35:00.000Z', rootActivityId: '8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d' },
  { id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', jobType: 'DataPipeline', invokeType: 'Scheduled', status: 'InProgress', startTime: '2026-03-15T14:18:20.000Z', endTime: null, rootActivityId: '9b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e' },
  { id: '7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b', jobType: 'NotebookJob', invokeType: 'Manual', status: 'Failed', startTime: '2026-03-15T12:10:00.000Z', endTime: '2026-03-15T12:12:15.000Z', rootActivityId: '0c1d2e3f-4a5b-6c7d-8e9f-0a1b2c3d4e5f', errorMsg: 'ErrorCode: SchemaTypeConflictException - Target table schema mismatch.' },
  { id: '3b4c5d6e-7f8a-9b0c-1d2e-3f4a5b6c7d8e', jobType: 'DefaultJob', invokeType: 'Scheduled', status: 'Deduped', startTime: '2026-03-15T11:00:00.000Z', endTime: '2026-03-15T11:00:00.000Z', rootActivityId: '1d2e3f4a-5b6c-7d8e-9f0a-1b2c3d4e5f6a' },
];

const WS = '12345678-abcd-1234-abcd-1234567890ab';

export const workspaces: Workspace[] = [{ workspaceId: WS, workspaceName: 'Production Analytics', capacityId: null }];

export const lakehouses: Lakehouse[] = [
  { lakehouseId: '431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7', lakehouseName: 'Sales Analytics Lakehouse', workspaceId: WS, workspaceName: 'Production Analytics', connectionId: 'conn-1' },
];

export const warehouses: Warehouse[] = [
  { warehouseId: '9c6c8d7b-1a2b-3c4d-5e6f-7a8b9c0d1e2f', warehouseName: 'Sales Warehouse', workspaceId: WS, workspaceName: 'Production Analytics', connectionId: 'conn-1' },
];

export const mirroredDbs: MirroredDatabaseSummary[] = [
  { mirroredDatabaseId: '8a421e3f-9b8c-7d6e-5f4a-3b2c1d0e9f8a', mirroredDatabaseName: 'CustomerDB', workspaceId: WS, workspaceName: 'Production Analytics', sourceType: 'AzureSqlDatabase', sourceName: 'CustomerSource', createdAt: null, status: 'Active', mirroringStatus: 'Running' },
];

const USER = '00000000-0000-0000-0000-000000000001';

export const notifications: Notification[] = [
  {
    id: 'n-1',
    userId: USER,
    type: 'operation.succeeded',
    title: 'Load table completed',
    message: 'The Customers table was loaded successfully.',
    operationId: 'op-1',
    isRead: false,
    createdAt: '2026-10-28T09:45:00Z',
    readAt: null,
  },
  {
    id: 'n-2',
    userId: USER,
    type: 'operation.failed',
    title: 'Load table failed',
    message: 'Unable to load the CustomerOrders table. Schema mismatch.',
    operationId: 'op-2',
    isRead: false,
    createdAt: '2026-10-28T09:30:00Z',
    readAt: null,
  },
  {
    id: 'n-3',
    userId: USER,
    type: 'connection.created.succeeded',
    title: 'Connection created',
    message: "Connection 'Production Fabric' was created successfully.",
    operationId: null,
    isRead: true,
    createdAt: '2026-10-28T09:10:00Z',
    readAt: '2026-10-28T09:12:00Z',
  },
];

// ---- Catalog (Tables explorer) ----
type RawColumn = [name: string, type: string, nullable: boolean, description: string | null];

const RAW_CATALOG: Record<string, Record<string, RawColumn[]>> = {
  dbo: {
    Customers: [
      ['CustomerId', 'bigint', false, 'Primary key customer identifier'],
      ['CustomerName', 'string', false, 'Full legal customer name'],
      ['Email', 'string', true, 'Primary contact email address'],
      ['CreditLimit', 'decimal(18,2)', false, 'Approved line of credit in USD'],
      ['RegionId', 'int', false, 'Sales geographic region code'],
      ['IsActive', 'boolean', false, null],
    ],
    Orders: [
      ['OrderId', 'bigint', false, 'Unique sales order identifier'],
      ['CustomerId', 'bigint', false, 'Foreign key to dbo.Customers'],
      ['OrderDate', 'timestamp', false, 'Order placement timestamp'],
      ['TotalAmount', 'decimal(18,2)', false, 'Net total transaction value'],
      ['OrderStatus', 'string', false, 'Order processing status'],
    ],
    OrderItems: [
      ['OrderItemId', 'bigint', false, 'Line item surrogate key'],
      ['OrderId', 'bigint', false, 'Foreign key to dbo.Orders'],
      ['ProductId', 'bigint', false, 'Foreign key to dbo.Products'],
      ['Quantity', 'int', false, 'Ordered unit quantity'],
      ['UnitPrice', 'decimal(18,2)', false, 'Unit price at purchase'],
    ],
    Products: [
      ['ProductId', 'bigint', false, 'Product SKU identifier'],
      ['ProductName', 'string', false, 'Catalog product title'],
      ['Category', 'string', false, null],
      ['UnitPrice', 'decimal(18,2)', false, 'Retail list price'],
      ['InStock', 'int', false, 'Available warehouse inventory'],
    ],
  },
  sales: {
    Transactions: [
      ['TransactionId', 'string', false, 'Transaction GUID hash'],
      ['Amount', 'decimal(18,2)', false, 'Transaction amount'],
      ['PaymentMethod', 'string', true, 'Payment channel used'],
      ['TxTimestamp', 'timestamp', false, 'Transaction execution time'],
    ],
  },
};

export const catalogTree: CatalogTree = {
  lakehouseId: lakehouses[0].lakehouseId,
  totalTables: Object.values(RAW_CATALOG).reduce((n, tables) => n + Object.keys(tables).length, 0),
  schemas: Object.entries(RAW_CATALOG).map(([schema, tables]) => ({
    name: schema,
    tables: Object.entries(tables).map(([name, cols]) => ({
      name,
      schema,
      type: 'MANAGED',
      format: 'DELTA',
      columnCount: cols.length,
    })),
  })),
};

export const catalogTables: Record<string, CatalogTableDetail> = Object.fromEntries(
  Object.entries(RAW_CATALOG).flatMap(([schema, tables]) =>
    Object.entries(tables).map(([name, cols]): [string, CatalogTableDetail] => [
      `${schema}.${name}`,
      {
        schema,
        name,
        fullName: `${schema}.${name}`,
        description: name === 'Customers' ? 'Customer master data synchronised nightly from the CRM.' : null,
        type: 'MANAGED',
        format: 'DELTA',
        location: `Tables/${schema}/${name}`,
        columns: cols.map(
          ([colName, type, nullable, description], position): CatalogColumn => ({ name: colName, type, position, nullable, description }),
        ),
      },
    ]),
  ),
);
