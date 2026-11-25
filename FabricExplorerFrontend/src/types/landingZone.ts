export interface LandingZoneConfig {
  isConfigured: boolean;
  storageEndpoint: string | null;
  fileSystem: string | null;
  rootPath: string | null;
  /** abfss://{file system}@{host}/{root} */
  uri: string | null;
  updatedAt: string | null;
}

/** Either a mirrored database of the active workspace (OneLake Open Mirroring) or a storage URI. */
export interface ConfigureLandingZonePayload {
  mirroredDatabaseId?: string;
  storageUri?: string;
}

export interface LandingZoneItem {
  name: string;
  /** relative to the Landing Zone root, no leading slash */
  path: string;
  isFolder: boolean;
  /** lower case, without dot */
  extension: string | null;
  sizeBytes: number | null;
  lastModified: string | null;
  owner: string | null;
}

export interface LandingZoneList {
  path: string;
  items: LandingZoneItem[];
  truncated: boolean;
}

export interface LandingZoneFolder {
  name: string;
  path: string;
}

export interface LandingZoneFolders {
  path: string;
  folders: LandingZoneFolder[];
  truncated: boolean;
}

export interface LandingZoneFileDetails {
  name: string;
  path: string;
  extension: string | null;
  sizeBytes: number;
  contentType: string;
  createdAt: string | null;
  lastModified: string | null;
  storageUri: string;
}

export type LandingZonePreviewKind = 'csv' | 'json' | 'text' | 'unsupported';

export interface LandingZonePreview {
  kind: LandingZonePreviewKind;
  headers: string[] | null;
  rows: string[][] | null;
  text: string | null;
  truncated: boolean;
  delimiter: string | null;
}

export interface LandingZoneItemRef {
  path: string;
  isFolder: boolean;
}

export interface LandingZoneItemResult {
  path: string;
  name: string;
  success: boolean;
  error: string | null;
}

export interface LandingZoneExistingFiles {
  /** Requested names that already exist in the destination folder. */
  existing: string[];
}

export interface LandingZoneBatch {
  results: LandingZoneItemResult[];
  succeeded: number;
  failed: number;
}

export interface LandingZoneOperation {
  id: string;
  operation: string;
  item: string;
  /** folder the operation happened in, starts with "/" */
  path: string;
  status: 'Completed' | 'Failed' | string;
  details: string | null;
  createdAt: string;
}

export type LandingZoneSortField = 'name' | 'type' | 'size' | 'modified';
export type LandingZoneViewMode = 'list' | 'grid';
export type LandingZoneSearchScope = 'current' | 'recursive';

// ---------- Generate Metadata (XSD -> Open Mirroring _metadata.json) ----------

export type FormatOptionKind = 'Text' | 'EscapedText' | 'Choice' | 'Flag';

/** Describes one option of a file format; the wizard renders its form from these descriptors. */
export interface FormatOption {
  key: string;
  label: string;
  kind: FormatOptionKind;
  defaultValue: string;
  required: boolean;
  readOnly: boolean;
  hint: string | null;
  choices: string[] | null;
  pattern: string | null;
}

export interface MetadataFormatInfo {
  name: string;
  title: string;
  description: string;
  requiresColumnTypes: boolean;
  options: FormatOption[];
}

export interface MetadataCapabilities {
  formats: MetadataFormatInfo[];
  fabricTypes: string[];
  metadataFileName: string;
  schemaFolderSuffix: string;
}

export interface XsdRecordField {
  name: string;
  /** e.g. "xs:int" or "EmailAddressType" */
  xsdType: string;
  /** Open Mirroring data type; "" when the user has to choose */
  recommendedFabricType: string;
  nullable: boolean;
  isKeyCandidate: boolean;
  isAttribute: boolean;
  isNested: boolean;
  isRepeating: boolean;
}

export interface XsdRecord {
  name: string;
  fields: XsdRecordField[];
}

export interface XsdAnalysis {
  targetNamespace: string;
  records: XsdRecord[];
  complexTypeCount: number;
  simpleTypeCount: number;
}

export interface MetadataColumn {
  name: string;
  fabricType: string;
  included: boolean;
  nullable: boolean;
}

export interface MetadataRequest {
  fileFormat: string;
  keyColumns: string[];
  columns: MetadataColumn[];
  /** values by FormatOption.key */
  options: Record<string, string>;
}

export interface MetadataPreview {
  fileName: string;
  json: string;
  isValid: boolean;
  errors: string[];
}

export interface PublishMetadataPayload {
  /** folder the {schema}.schema folder is created in ("" = Landing Zone root) */
  parentPath: string;
  schemaName: string;
  tableName: string;
  overwrite: boolean;
  metadata: MetadataRequest;
}

export interface PublishMetadataResult {
  filePath: string;
  overwritten: boolean;
}
