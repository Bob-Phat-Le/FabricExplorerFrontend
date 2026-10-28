export type ReplPayloadFormat = 'Parquet' | 'CSV';
export type ChangeType = 'Insert' | 'Update' | 'Delete' | 'None';

/** Body của POST /replications. */
export interface ReplicationConfig {
  database: string;
  schema: string;
  table: string;
  autoMetadata: boolean;
  primaryKeys: string[];
  payloadFormat: ReplPayloadFormat;
  rowMarkerEnabled: boolean;
  sourceField: string;
  changeTypes: ChangeType[];
}

export interface ReplicationResult {
  id: string;
  status: string;
}
