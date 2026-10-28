export type UploadMode = 'Overwrite' | 'Append' | 'Create New';
export type PayloadFormat = 'CSV' | 'Parquet';
export type TableLoadMode = 'Append' | 'Overwrite';
export type PostLoadAction = 'Archive' | 'Retain' | 'Delete';

/** Config sent in `config` of POST /ingestions. */
export interface IngestionForm {
  hasFile: boolean;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadMode: UploadMode;
  payloadFormat: PayloadFormat;
  csvHeader: boolean;
  csvDelimiter: string;
  ingestToTable: boolean;
  targetTable: string;
  tableLoadMode: TableLoadMode;
  postLoadAction: PostLoadAction;
  archivePath: string;
}

export interface IngestionResult {
  jobId: string;
  status: string;
}
