import type { StepDef } from '@/components/ui/Stepper';
import type { ChangeType, ReplicationConfig } from '@/types/replication';

export const INITIAL_CONFIG: ReplicationConfig = {
  database: 'CustomerMirror',
  schema: 'dbo',
  table: 'Customers',
  autoMetadata: true,
  primaryKeys: ['CustomerId'],
  payloadFormat: 'Parquet',
  rowMarkerEnabled: true,
  sourceField: 'UpdatedAt',
  changeTypes: ['Insert', 'Update'],
};

export const STEPS: StepDef[] = [
  { title: 'Target DB', subtitle: 'Destination' },
  { title: 'Source Table', subtitle: 'Schema & Entity' },
  { title: 'Metadata', subtitle: 'Primary Keys' },
  { title: 'Payload', subtitle: 'Format' },
  { title: 'Row Marker', subtitle: 'CDC Tracking' },
  { title: 'Review & Start', subtitle: 'Summary' },
];

export const TOTAL_STEPS = STEPS.length;

export const DATABASES = [
  { value: 'CustomerMirror', workspace: 'Data Platform' },
  { value: 'SalesMirror', workspace: 'Analytics' },
  { value: 'EnterpriseDataMirror', workspace: 'Enterprise' },
];

export const SCHEMAS = ['dbo', 'sales', 'analytics'];
export const TABLES = ['Customers', 'Orders', 'Products', 'Inventory'];
export const PK_COLUMNS = ['CustomerId', 'RegionId', 'CustomerName', 'Email'];
export const SOURCE_FIELDS = ['UpdatedAt', 'ChangeTimestamp', 'ModifiedDate', 'LastModified'];
export const CHANGE_TYPES: ChangeType[] = ['Insert', 'Update', 'Delete', 'None'];

export const PAYLOAD_DESCRIPTIONS = {
  Parquet: 'Columnar format optimized for high-performance analytics and large-scale data processing in Microsoft Fabric.',
  CSV: 'Delimited text format suitable for interoperability with external legacy data systems.',
} as const;

export type ReplStatus = 'Running' | 'Completed';

export interface ReplicationHistoryRow {
  database: string;
  schema: string;
  table: string;
  format: string;
  rowMarker: boolean;
  status: ReplStatus;
  lastActivity: string;
}

export const HISTORY: ReplicationHistoryRow[] = [
  { database: 'CustomerMirror', schema: 'dbo', table: 'Customers', format: 'Parquet', rowMarker: true, status: 'Running', lastActivity: 'Just now' },
  { database: 'SalesMirror', schema: 'dbo', table: 'Orders', format: 'CSV', rowMarker: false, status: 'Running', lastActivity: '2 min ago' },
  { database: 'CustomerMirror', schema: 'dbo', table: 'Products', format: 'Parquet', rowMarker: true, status: 'Completed', lastActivity: '10 min ago' },
];
