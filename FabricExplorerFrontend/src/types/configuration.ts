import type { FileSavedQuery } from './FileSavedQuery';

/** Import / Export configuration (connections + saved queries). Mirrors `/api/configuration/*`. */

export type ConfigEntryType = 'Connection' | 'SavedQuery';
export type ImportMode = 'merge' | 'overwrite';
export type ExportScope = 'all' | 'selected';

export interface ConfigurationTypeInfo {
  type: ConfigEntryType | string;
  collection: string;
}

export interface ConfigurationCapabilities {
  format: string;
  supportedFormatVersions: number[];
  maxFileSizeBytes: number;
  maxEntriesPerType: number;
  types: ConfigurationTypeInfo[];
  importModes: string[];
}

// ---------- inventory ----------

export interface ConfigurationItem {
  type: ConfigEntryType;
  id: string;
  key: string;
  name: string;
  source?: string | null;
  parentName?: string | null;
  updatedAt?: string | null;
  /** Connection: `Configured` | `Missing`. Saved query: `Resolved` | `Unresolved`. */
  status: string;
  issues: string[];
}

export interface ConfigurationItemsQuery {
  type?: string;
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}

export interface ConfigurationItemsPage {
  items: ConfigurationItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

// ---------- export ----------

export interface ExportItemRef {
  type: ConfigEntryType;
  id: string;
}

export interface ExportRequest {
  scope: ExportScope;
  items?: ExportItemRef[];
  include: { landingZone: boolean };
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  exported: number | null;
  skipped: number;
}

// ---------- file (client-side view of the uploaded document) ----------

export interface ConfigurationFileDocument {
  format?: string;
  formatVersion?: number;
  exportedAt?: string;
  connections?: Array<{
    key?: string;
    name?: string;
    landingZone?: { uri?: string | null } | null;
    [k: string]: unknown;
  }>;
  savedQueries?: FileSavedQuery[];
  [k: string]: unknown;
}

// ---------- import: preview ----------

export interface FileIssue {
  code: string;
  message: string;
}

export interface ValidationIssue {
  code: string;
  field: string;
  message: string;
}

export type MatchKind = 'none' | 'exact' | 'probable';

export interface MatchInfo {
  kind: MatchKind;
  existingId?: string | null;
  by?: string | null;
}

export interface PreviewEntry {
  type: ConfigEntryType;
  key?: string | null;
  name?: string | null;
  match: MatchInfo;
  validation: { valid: boolean; errors: ValidationIssue[] };
  flags: string[];
}

export interface PreviewSummary {
  total: number;
  new: number;
  existing: number;
  invalid: number;
}

export interface PreviewResponse {
  formatVersion: number | null;
  integrityValid: boolean;
  fileErrors: FileIssue[];
  entries: PreviewEntry[];
  summary: PreviewSummary;
}

// ---------- import: execute ----------

export interface ImportEntryRef {
  type: ConfigEntryType;
  key: string;
}

export interface ImportOptions {
  /** File connection key -> id of an existing connection. */
  referenceMappings?: Record<string, string>;
  restoreLandingZone: boolean;
  atomic: boolean;
  ignoreIntegrityMismatch: boolean;
}

export interface ImportRequest {
  document: ConfigurationFileDocument;
  mode: ImportMode;
  selection: ImportEntryRef[];
  options: ImportOptions;
}

export type ImportAction = 'created' | 'updated' | 'skipped' | 'failed';

export interface ImportResultItem {
  type: ConfigEntryType;
  key?: string | null;
  name?: string | null;
  action: ImportAction;
  id?: string | null;
  success: boolean;
  error?: { code: string; message: string } | null;
  flags: string[];
}

export interface ImportResponse {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  results: ImportResultItem[];
}

// ---------- history ----------

export interface ConfigurationHistoryItem {
  id: string;
  kind: string;
  status: string;
  summary?: string | null;
  itemCount: number;
  createdAt: string;
}
