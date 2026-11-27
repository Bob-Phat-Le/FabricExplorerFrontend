import type { MockSavedQuery } from './MockSavedQuery';

const daysAgo = (days: number) => new Date(Date.now() - days * 86400e3).toISOString();

/**
 * The saved queries of the mock backend. One array, shared by `savedQueryMocks` (Query Editor)
 * and `configurationMocks` (Import / Export), so what is saved in one place shows up in the other.
 */
export const savedQueryRows: MockSavedQuery[] = [
  {
    id: 'sq-1',
    key: 'c3d9a8f1-6b52-4e0d-a7c4-91e2f5b83d07',
    name: 'Daily Sales',
    description: 'Daily revenue',
    connectionId: 'conn-1',
    itemType: 'Warehouse',
    itemId: '9c6c8d7b-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
    itemName: 'Sales Warehouse',
    sql: 'SELECT * FROM dbo.DailySales;',
    maxRows: 1000,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(4),
  },
  {
    id: 'sq-2',
    key: 'e81b47c2-0d3f-4b9a-96a5-3c7d2f1e8b60',
    name: 'Customer Report',
    description: null,
    connectionId: 'conn-2',
    itemType: 'Lakehouse',
    itemId: '431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7',
    itemName: 'Sales Analytics Lakehouse',
    sql: 'SELECT TOP 100 * FROM [dbo].[Customers];',
    maxRows: null,
    createdAt: daysAgo(28),
    updatedAt: daysAgo(1),
  },
  {
    id: 'sq-3',
    key: '4a7d5c10-2e8b-4f63-b1a9-0c6e3d9f7a52',
    name: 'Active Customers',
    description: 'Customers with a credit limit above 50k',
    connectionId: 'conn-1',
    itemType: 'Lakehouse',
    itemId: '431e8d7b-4a95-4c02-8ccd-6faef5ba1bd7',
    itemName: 'Sales Analytics Lakehouse',
    sql: 'SELECT\n    [CustomerId],\n    [CustomerName],\n    [Email],\n    [CreditLimit]\nFROM [dbo].[Customers]\nWHERE [CreditLimit] > 50000;',
    maxRows: 100,
    createdAt: daysAgo(10),
    updatedAt: null,
  },
];
