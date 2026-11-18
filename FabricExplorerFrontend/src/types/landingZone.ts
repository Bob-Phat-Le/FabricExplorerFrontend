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
