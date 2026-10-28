import type { StepDef } from '@/components/ui/Stepper';
import type { IngestionForm } from '@/types/ingestion';

export const INITIAL_FORM: IngestionForm = {
  hasFile: false,
  fileName: 'customers.csv',
  fileSize: '24.8 MB',
  fileType: 'CSV',
  uploadMode: 'Overwrite',
  payloadFormat: 'CSV',
  csvHeader: true,
  csvDelimiter: ',',
  ingestToTable: true,
  targetTable: 'Customers',
  tableLoadMode: 'Append',
  postLoadAction: 'Archive',
  archivePath: '/archive/customers/',
};

export const STEPS: StepDef[] = [
  { title: 'File & Upload', subtitle: 'Select payload & mode' },
  { title: 'Format & Settings', subtitle: 'Parser configurations' },
  { title: 'Target Table', subtitle: 'Destination table load' },
  { title: 'Post-Load Action', subtitle: 'Staged file disposal' },
  { title: 'Review & Ingest', subtitle: 'Pipeline trigger' },
];

export const TOTAL_STEPS = STEPS.length;

export type HistoryStatus = 'Completed' | 'Failed';

export interface IngestionHistoryRow {
  fileName: string;
  format: string;
  table: string;
  status: HistoryStatus;
  records: string;
  started: string;
}

/** TODO(api): thay bằng ingestionApi.list() khi backend có GET /ingestions. */
export const HISTORY: IngestionHistoryRow[] = [
  { fileName: 'customers.csv', format: 'CSV', table: 'Customers', status: 'Completed', records: '125,420', started: '14:20' },
  { fileName: 'orders.parquet', format: 'Parquet', table: 'Orders', status: 'Completed', records: '842,301', started: '13:55' },
  { fileName: 'products.csv', format: 'CSV', table: 'Products', status: 'Failed', records: '—', started: '13:42' },
];
