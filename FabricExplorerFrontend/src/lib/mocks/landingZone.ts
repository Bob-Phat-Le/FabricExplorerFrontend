import { ApiError, type RequestOptions } from '../api/client';
import { MOCK_CAPABILITIES, analyzeXsd, buildMetadata, getMetadataCapabilities, previewMetadata } from './metadata';
import type {
  ConfigureLandingZonePayload,
  LandingZoneBatch,
  LandingZoneConfig,
  LandingZoneExistingFiles,
  LandingZoneFileDetails,
  LandingZoneFolders,
  LandingZoneItem,
  LandingZoneItemRef,
  LandingZoneItemResult,
  LandingZoneList,
  LandingZoneOperation,
  LandingZonePreview,
  PublishMetadataPayload,
  PublishMetadataResult,
} from '@/types/landingZone';

/** In-memory Landing Zone used when NEXT_PUBLIC_USE_MOCK=true. */

interface Node {
  path: string;
  isFolder: boolean;
  sizeBytes: number;
  lastModified: string;
  createdAt: string;
  content?: string;
}

const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60e3).toISOString();
const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);
const parentOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
const extOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : null);
const join = (a: string, b: string) => (a ? `${a}/${b}` : b);

const csv =
  'customer_id,customer_name,segment,country,credit_limit\n1001,Acme Corporation,Enterprise,United States,150000.00\n1002,Global Logistics Ltd,Commercial,United Kingdom,250000.00\n1003,Northwind Traders,SMB,Canada,45000.00\n';

const folder = (path: string, minutesAgo = 600): Node => ({ path, isFolder: true, sizeBytes: 0, lastModified: iso(minutesAgo), createdAt: iso(60000) });
const file = (path: string, content: string, minutesAgo = 120, size = content.length): Node => ({
  path,
  isFolder: false,
  sizeBytes: size,
  lastModified: iso(minutesAgo),
  createdAt: iso(minutesAgo + 30),
  content,
});

let nodes: Node[] = [
  folder('dbo.schema'),
  folder('dbo.schema/Orders'),
  file('dbo.schema/Orders/_metadata.json', JSON.stringify({ keyColumns: ['OrderId'], fileDetectionStrategy: 'LastUpdateTimeFileDetection' }), 300),
  folder('raw'),
  folder('raw/customers'),
  file('raw/customers/customers.csv', csv, 30, 13002342),
  folder('raw/orders'),
  file('raw/orders/orders_2026_11.csv', csv.replace(/customer/g, 'order'), 90, 842301),
  folder('processed'),
  folder('archive'),
];

let configured: LandingZoneConfig = {
  isConfigured: true,
  storageEndpoint: 'https://onelake.dfs.fabric.microsoft.com',
  fileSystem: '12345678-abcd-1234-abcd-1234567890ab',
  rootPath: '8a421e3f-9b8c-7d6e-5f4a-3b2c1d0e9f8a/Files/LandingZone',
  uri: 'abfss://12345678-abcd-1234-abcd-1234567890ab@onelake.dfs.fabric.microsoft.com/8a421e3f-9b8c-7d6e-5f4a-3b2c1d0e9f8a/Files/LandingZone',
  updatedAt: iso(1000),
};

let operations: LandingZoneOperation[] = [
  { id: 'op-1', operation: 'Upload', item: 'customers.csv', path: '/raw/customers', status: 'Completed', details: '12.4 MB uploaded', createdAt: iso(30) },
  { id: 'op-2', operation: 'Move', item: 'orders_2026_11.csv', path: '/raw/orders', status: 'Completed', details: 'Moved from /temporary', createdAt: iso(45) },
  { id: 'op-3', operation: 'Delete', item: 'temporary_dump.csv', path: '/temporary', status: 'Failed', details: 'HTTP 409 LeaseConflict: File is currently locked.', createdAt: iso(75) },
];

const notFound = (path: string) => new ApiError(`'/${path}' was not found.`, { status: 404, code: 'landing_zone.path_not_found' });
const conflict = (message: string) => new ApiError(message, { status: 409, code: 'landing_zone.already_exists' });

const toItem = (n: Node): LandingZoneItem => ({
  name: nameOf(n.path),
  path: n.path,
  isFolder: n.isFolder,
  extension: n.isFolder ? null : extOf(nameOf(n.path)),
  sizeBytes: n.isFolder ? null : n.sizeBytes,
  lastModified: n.lastModified,
  owner: 'john.doe@company.com',
});

const isInside = (path: string, ancestor: string) => !ancestor || path === ancestor || path.startsWith(`${ancestor}/`);
const exists = (path: string) => !path || nodes.some((n) => n.path === path);
const log = (operation: string, item: string, path: string, ok: boolean, details: string) =>
  operations.unshift({ id: `op-${crypto.randomUUID()}`, operation, item, path: `/${path}`, status: ok ? 'Completed' : 'Failed', details, createdAt: new Date().toISOString() });

const q = (req: RequestOptions) => (req.query ?? {}) as Record<string, string | undefined>;
const body = <T>(req: RequestOptions) => req.body as T;

export const landingZoneMocks = {
  config: (): LandingZoneConfig => configured,

  configure: (req: RequestOptions): LandingZoneConfig => {
    const payload = body<ConfigureLandingZonePayload>(req);
    if (!payload.mirroredDatabaseId && !payload.storageUri?.trim()) {
      throw new ApiError('Choose a mirrored database or enter a storage URI.', { status: 400, code: 'landing_zone.bad_request' });
    }
    configured = {
      isConfigured: true,
      storageEndpoint: 'https://onelake.dfs.fabric.microsoft.com',
      fileSystem: '12345678-abcd-1234-abcd-1234567890ab',
      rootPath: payload.mirroredDatabaseId ? `${payload.mirroredDatabaseId}/Files/LandingZone` : (payload.storageUri ?? ''),
      uri: payload.storageUri?.trim() || `abfss://12345678-abcd-1234-abcd-1234567890ab@onelake.dfs.fabric.microsoft.com/${payload.mirroredDatabaseId}/Files/LandingZone`,
      updatedAt: new Date().toISOString(),
    };
    return configured;
  },

  remove: () => {
    configured = { isConfigured: false, storageEndpoint: null, fileSystem: null, rootPath: null, uri: null, updatedAt: null };
    return { message: 'Landing Zone configuration removed.' };
  },

  items: (req: RequestOptions): LandingZoneList => {
    const path = q(req).path ?? '';
    if (!exists(path)) throw notFound(path);
    return { path, items: nodes.filter((n) => parentOf(n.path) === path).map(toItem), truncated: false };
  },

  folders: (req: RequestOptions): LandingZoneFolders => {
    const path = q(req).path ?? '';
    if (!exists(path)) throw notFound(path);
    const folders = nodes
      .filter((n) => n.isFolder && parentOf(n.path) === path)
      .map((n) => ({ name: nameOf(n.path), path: n.path }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { path, folders, truncated: false };
  },

  search: (req: RequestOptions): LandingZoneList => {
    const { path = '', query = '' } = q(req);
    const term = query.toLowerCase();
    return { path, items: nodes.filter((n) => isInside(n.path, path) && n.path !== path && nameOf(n.path).toLowerCase().includes(term)).map(toItem), truncated: false };
  },

  details: (req: RequestOptions): LandingZoneFileDetails => {
    const path = q(req).path ?? '';
    const n = nodes.find((x) => x.path === path && !x.isFolder);
    if (!n) throw notFound(path);
    const name = nameOf(path);
    return {
      name,
      path,
      extension: extOf(name),
      sizeBytes: n.sizeBytes,
      contentType: extOf(name) === 'csv' ? 'text/csv' : extOf(name) === 'json' ? 'application/json' : 'application/octet-stream',
      createdAt: n.createdAt,
      lastModified: n.lastModified,
      storageUri: `${configured.uri ?? 'abfss://landing-zone@storage.dfs.core.windows.net'}/${path}`,
    };
  },

  preview: (req: RequestOptions): LandingZonePreview => {
    const path = q(req).path ?? '';
    const n = nodes.find((x) => x.path === path && !x.isFolder);
    if (!n) throw notFound(path);
    const ext = extOf(nameOf(path));
    const text = n.content ?? '';
    if (ext === 'csv') {
      const [head, ...rows] = text.split('\n').filter(Boolean).map((l) => l.split(','));
      return { kind: 'csv', headers: head ?? [], rows: rows.slice(0, 5), text: null, truncated: n.sizeBytes > text.length, delimiter: ',' };
    }
    if (ext === 'json') {
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* keep raw */
      }
      return { kind: 'json', headers: null, rows: null, text: pretty, truncated: false, delimiter: null };
    }
    if (ext === 'txt' || ext === 'md' || ext === 'xml' || ext === 'xsd') {
      return { kind: 'text', headers: null, rows: null, text, truncated: false, delimiter: null };
    }
    return { kind: 'unsupported', headers: null, rows: null, text: null, truncated: false, delimiter: null };
  },

  createFolder: (req: RequestOptions): LandingZoneItem => {
    const { parentPath = '', name = '' } = body<{ parentPath?: string; name?: string }>(req);
    const path = join(parentPath.replace(/^\/+|\/+$/g, ''), name.trim());
    if (!exists(parentOf(path))) throw notFound(parentOf(path));
    if (exists(path)) {
      log('Create Folder', name, parentPath, false, 'A folder or file with this name already exists');
      throw conflict(`'${name}' already exists in this folder.`);
    }
    const node = folder(path, 0);
    nodes.push(node);
    log('Create Folder', name, parentPath, true, 'Directory created');
    return toItem(node);
  },

  rename: (req: RequestOptions): LandingZoneItem => {
    const { path = '', newName = '' } = body<{ path?: string; isFolder?: boolean; newName?: string }>(req);
    const target = join(parentOf(path), newName.trim());
    if (!exists(path)) throw notFound(path);
    if (exists(target)) throw conflict(`'${newName}' already exists in this folder.`);
    nodes = nodes.map((n) => (isInside(n.path, path) ? { ...n, path: target + n.path.slice(path.length) } : n));
    log('Rename', `${nameOf(path)} → ${newName}`, parentOf(path), true, 'Renamed');
    return toItem(nodes.find((n) => n.path === target)!);
  },

  move: (req: RequestOptions): LandingZoneBatch => transfer(req, true),
  copy: (req: RequestOptions): LandingZoneBatch => transfer(req, false),

  delete: (req: RequestOptions): LandingZoneBatch => {
    const { items = [] } = body<{ items?: LandingZoneItemRef[] }>(req);
    const results: LandingZoneItemResult[] = items.map(({ path }) => {
      if (!exists(path)) return { path, name: nameOf(path), success: false, error: 'HTTP 404 PathNotFound: The specified path does not exist.' };
      nodes = nodes.filter((n) => !isInside(n.path, path));
      log('Delete', nameOf(path), parentOf(path), true, 'Deleted');
      return { path, name: nameOf(path), success: true, error: null };
    });
    return summarize(results);
  },

  operations: (req?: RequestOptions): LandingZoneOperation[] => {
    const limit = Number(q(req ?? {}).limit);
    return Number.isFinite(limit) && limit > 0 ? operations.slice(0, limit) : operations;
  },

  getMetadataCapabilities,
  analyzeXsd,
  previewMetadata,

  publishMetadata: (req: RequestOptions): PublishMetadataResult => {
    const payload = body<PublishMetadataPayload>(req);
    const preview = buildMetadata(payload.metadata);
    if (!preview.isValid) throw new ApiError(preview.errors.join(' '), { status: 400, code: 'metadata_generate.invalid_metadata' });

    const parent = payload.parentPath.replace(/^\/+|\/+$/g, '');
    if (!exists(parent)) throw notFound(parent);

    const { metadataFileName, schemaFolderSuffix } = MOCK_CAPABILITIES;
    const schemaName = payload.schemaName.trim().replace(new RegExp(`${schemaFolderSuffix.replace('.', '\\.')}$`, 'i'), '');
    const schemaFolder = join(parent, `${schemaName}${schemaFolderSuffix}`);
    const tableFolder = join(schemaFolder, payload.tableName.trim());
    const filePath = join(tableFolder, metadataFileName);

    const existing = exists(filePath);
    if (existing && !payload.overwrite) {
      log('Generate Metadata', metadataFileName, tableFolder, false, `${metadataFileName} already exists`);
      throw new ApiError(`${metadataFileName} already exists in '/${tableFolder}'.`, { status: 409, code: 'metadata_generate.metadata_already_exists' });
    }

    [schemaFolder, tableFolder].filter((p) => !exists(p)).forEach((p) => nodes.push(folder(p, 0)));
    nodes = nodes.filter((n) => n.path !== filePath);
    nodes.push(file(filePath, preview.json, 0, preview.json.length));
    log('Generate Metadata', metadataFileName, tableFolder, true, `${payload.metadata.fileFormat} metadata ${existing ? 'replaced' : 'created'}`);
    return { filePath, overwritten: existing };
  },

  checkExists: (req: RequestOptions): LandingZoneExistingFiles => {
    const { path = '', names = [], isFolder = false } = body<{ path?: string; names?: string[]; isFolder?: boolean }>(req);
    const dir = path.replace(/^\/+|\/+$/g, '');
    return {
      existing: names.filter((name) => nodes.some((node) => node.path === join(dir, name) && node.isFolder === isFolder)),
    };
  },

  /** Used by the mock upload (no HTTP involved). */
  upload: (path: string, files: File[], overwrite: boolean): LandingZoneBatch => {
    const results: LandingZoneItemResult[] = files.map((f) => {
      const target = join(path, f.name);
      if (exists(target) && !overwrite) {
        log('Upload', f.name, path, false, 'HTTP 409 PathAlreadyExists: The specified path already exists.');
        return { path: target, name: f.name, success: false, error: 'HTTP 409 PathAlreadyExists: The specified path already exists.' };
      }
      nodes = nodes.filter((n) => n.path !== target);
      nodes.push({ path: target, isFolder: false, sizeBytes: f.size, lastModified: iso(0), createdAt: iso(0), content: `Uploaded file: ${f.name}` });
      log('Upload', f.name, path, true, `${f.size} bytes uploaded`);
      return { path: target, name: f.name, success: true, error: null };
    });
    return summarize(results);
  },

  /** Used by the mock download. */
  contentOf: (path: string): string => {
    const n = nodes.find((x) => x.path === path && !x.isFolder);
    if (!n) throw notFound(path);
    log('Download', nameOf(path), parentOf(path), true, 'File downloaded');
    return n.content ?? nameOf(path);
  },
};

function summarize(results: LandingZoneItemResult[]): LandingZoneBatch {
  return { results, succeeded: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length };
}

function transfer(req: RequestOptions, move: boolean): LandingZoneBatch {
  const { items = [], destinationPath = '' } = body<{ items?: LandingZoneItemRef[]; destinationPath?: string }>(req);
  const destination = destinationPath.replace(/^\/+|\/+$/g, '');
  if (!exists(destination)) throw notFound(destination);

  const results: LandingZoneItemResult[] = items.map(({ path, isFolder }) => {
    const name = nameOf(path);
    const target = join(destination, name);
    const fail = (error: string) => {
      log(move ? 'Move' : 'Copy', name, destination, false, error);
      return { path, name, success: false, error };
    };
    if (!exists(path)) return fail('HTTP 404 PathNotFound: The specified path does not exist.');
    if (isFolder && isInside(destination, path)) return fail('A folder cannot be moved or copied into itself.');
    if (move && parentOf(path) === destination) return fail('The item is already in this folder.');
    if (exists(target)) return fail('An item with this name already exists in the destination folder.');

    if (move) {
      nodes = nodes.map((n) => (isInside(n.path, path) ? { ...n, path: target + n.path.slice(path.length) } : n));
    } else {
      nodes.push(...nodes.filter((n) => isInside(n.path, path)).map((n) => ({ ...n, path: target + n.path.slice(path.length) })));
    }
    log(move ? 'Move' : 'Copy', name, destination, true, `${move ? 'Moved' : 'Copied'} from /${parentOf(path)}`);
    return { path, name, success: true, error: null };
  });
  return summarize(results);
}
