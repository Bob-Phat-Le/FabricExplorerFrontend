import { API_CONFIG } from './config';
import { ApiError, call, parseError, sleep } from './client';
import { mocks } from '../mocks/handlers';
import type {
  ConfigureLandingZonePayload,
  LandingZoneBatch,
  LandingZoneConfig,
  LandingZoneFileDetails,
  LandingZoneFolders,
  LandingZoneItem,
  LandingZoneItemRef,
  LandingZoneList,
  LandingZoneOperation,
  LandingZonePreview,
  MetadataCapabilities,
  MetadataPreview,
  MetadataRequest,
  PublishMetadataPayload,
  PublishMetadataResult,
  XsdAnalysis,
} from '@/types/landingZone';

interface Opts {
  signal?: AbortSignal;
}

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && 'statusCode' in r && 'data' in r ? (r as { data: T }).data : r) as T;

const BASE = '/landing-zone';
const headers = (connectionId: string) => ({ 'X-Connection-Id': connectionId });

// ---------- configuration ----------

export const getConfig = (connectionId: string, { signal }: Opts = {}) =>
  call<unknown>({ method: 'GET', path: BASE, headers: headers(connectionId), signal }, mocks.landingZone.config).then((r) =>
    unwrap<LandingZoneConfig>(r),
  );

export const configure = (connectionId: string, payload: ConfigureLandingZonePayload) =>
  call<unknown>({ method: 'PUT', path: BASE, headers: headers(connectionId), body: payload }, mocks.landingZone.configure).then((r) =>
    unwrap<LandingZoneConfig>(r),
  );

export const removeConfig = (connectionId: string) =>
  call<unknown>({ method: 'DELETE', path: BASE, headers: headers(connectionId) }, mocks.landingZone.remove);

// ---------- browsing ----------

export const listItems = (connectionId: string, path: string, { signal }: Opts = {}) =>
  call<unknown>({ method: 'GET', path: `${BASE}/items`, query: { path }, headers: headers(connectionId), signal }, mocks.landingZone.items).then(
    (r) => unwrap<LandingZoneList>(r),
  );

export const listFolders = (connectionId: string, path: string, { signal }: Opts = {}) =>
  call<unknown>({ method: 'GET', path: `${BASE}/folders`, query: { path }, headers: headers(connectionId), signal }, mocks.landingZone.folders).then(
    (r) => unwrap<LandingZoneFolders>(r),
  );

export const search = (connectionId: string, query: string, path = '', { signal }: Opts = {}) =>
  call<unknown>(
    { method: 'GET', path: `${BASE}/search`, query: { path, query }, headers: headers(connectionId), signal },
    mocks.landingZone.search,
  ).then((r) => unwrap<LandingZoneList>(r));

export const getFileDetails = (connectionId: string, path: string, { signal }: Opts = {}) =>
  call<unknown>(
    { method: 'GET', path: `${BASE}/files/details`, query: { path }, headers: headers(connectionId), signal },
    mocks.landingZone.details,
  ).then((r) => unwrap<LandingZoneFileDetails>(r));

export const getPreview = (connectionId: string, path: string, { signal }: Opts = {}) =>
  call<unknown>(
    { method: 'GET', path: `${BASE}/files/preview`, query: { path }, headers: headers(connectionId), signal },
    mocks.landingZone.preview,
  ).then((r) => unwrap<LandingZonePreview>(r));

export const listOperations = (connectionId: string, limit = 50, { signal }: Opts = {}) =>
  call<unknown>(
    { method: 'GET', path: `${BASE}/operations`, query: { limit }, headers: headers(connectionId), signal },
    mocks.landingZone.operations,
  ).then((r) => unwrap<LandingZoneOperation[]>(r));

// ---------- organize ----------

export const createFolder = (connectionId: string, parentPath: string, name: string) =>
  call<unknown>(
    { method: 'POST', path: `${BASE}/folders`, headers: headers(connectionId), body: { parentPath, name } },
    mocks.landingZone.createFolder,
  ).then((r) => unwrap<LandingZoneItem>(r));

export const renameItem = (connectionId: string, item: LandingZoneItemRef, newName: string) =>
  call<unknown>(
    { method: 'POST', path: `${BASE}/items/rename`, headers: headers(connectionId), body: { path: item.path, isFolder: item.isFolder, newName } },
    mocks.landingZone.rename,
  ).then((r) => unwrap<LandingZoneItem>(r));

export const transferItems = (connectionId: string, mode: 'move' | 'copy', items: LandingZoneItemRef[], destinationPath: string) =>
  call<unknown>(
    { method: 'POST', path: `${BASE}/items/${mode}`, headers: headers(connectionId), body: { items, destinationPath } },
    mode === 'move' ? mocks.landingZone.move : mocks.landingZone.copy,
  ).then((r) => unwrap<LandingZoneBatch>(r));

export const deleteItems = (connectionId: string, items: LandingZoneItemRef[]) =>
  call<unknown>(
    { method: 'POST', path: `${BASE}/items/delete`, headers: headers(connectionId), body: { items } },
    mocks.landingZone.delete,
  ).then((r) => unwrap<LandingZoneBatch>(r));

// ---------- upload / download (no 30s timeout: files can be large) ----------

async function rawRequest(path: string, init: RequestInit & { query?: Record<string, string> }): Promise<Response> {
  const url = new URL(API_CONFIG.baseUrl + path, window.location.origin);
  Object.entries(init.query ?? {}).forEach(([k, v]) => url.searchParams.set(k, v));

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...API_CONFIG.getAuthHeaders(), ...(init.headers as Record<string, string> | undefined) } });
  } catch {
    throw new ApiError(`Cannot reach the server at ${API_CONFIG.baseUrl} (is the backend running and CORS enabled?)`, { code: 'NETWORK' });
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const { message, code, details, traceId } = parseError(payload, res.status);
    throw new ApiError(message, { status: res.status, code, details, traceId });
  }
  return res;
}

export async function uploadFiles(connectionId: string, path: string, files: File[], overwrite: boolean): Promise<LandingZoneBatch> {
  if (API_CONFIG.useMock) return structuredClone(mocks.landingZone.upload(path, files, overwrite));

  const form = new FormData();
  form.append('path', path);
  form.append('overwrite', String(overwrite));
  files.forEach((f) => form.append('files', f, f.name));

  const res = await rawRequest(`${BASE}/files/upload`, { method: 'POST', headers: headers(connectionId), body: form });
  return unwrap<LandingZoneBatch>(await res.json());
}

export async function downloadFile(connectionId: string, path: string): Promise<Blob> {
  if (API_CONFIG.useMock) return new Blob([mocks.landingZone.contentOf(path)], { type: 'text/plain' });

  const res = await rawRequest(`${BASE}/files/download`, { method: 'GET', query: { path }, headers: headers(connectionId) });
  return res.blob();
}

export async function downloadArchive(connectionId: string, paths: string[]): Promise<Blob> {
  if (API_CONFIG.useMock) {
    return new Blob([paths.map((p) => `${p}\n${mocks.landingZone.contentOf(p)}`).join('\n\n')], { type: 'text/plain' });
  }

  const res = await rawRequest(`${BASE}/files/archive`, {
    method: 'POST',
    headers: { ...headers(connectionId), 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths }),
  });
  return res.blob();
}

// ---------- generate metadata (XSD -> _metadata.json) ----------

/** Formats, their options and the Fabric data types the backend supports. */
export const getMetadataCapabilities = () =>
  call<unknown>({ method: 'GET', path: `${BASE}/metadata/capabilities` }, mocks.landingZone.getMetadataCapabilities).then((r) =>
    unwrap<MetadataCapabilities>(r),
  );

/** Uploads an XSD and returns its record candidates with the recommended Fabric types. */
export async function analyzeXsd(file: File, { signal }: Opts = {}): Promise<XsdAnalysis> {
  if (API_CONFIG.useMock) {
    await sleep(API_CONFIG.mockLatencyMs);
    return structuredClone(await mocks.landingZone.analyzeXsd(file));
  }

  const form = new FormData();
  form.append('file', file, file.name);

  const res = await rawRequest(`${BASE}/analyze-xsd`, { method: 'POST', body: form, signal });
  return unwrap<XsdAnalysis>(await res.json());
}

/** Validates the options and renders _metadata.json (invalid input is reported in `errors`, not thrown). */
export const previewMetadata = (request: MetadataRequest, { signal }: Opts = {}) =>
  call<unknown>({ method: 'POST', path: `${BASE}/preview`, body: request, signal }, mocks.landingZone.previewMetadata).then((r) =>
    unwrap<MetadataPreview>(r),
  );

/** Writes {parentPath}/{schemaName}.schema/{tableName}/_metadata.json into the Landing Zone. */
export const publishMetadata = (connectionId: string, payload: PublishMetadataPayload) =>
  call<unknown>(
    { method: 'POST', path: `${BASE}/publish`, headers: headers(connectionId), body: payload },
    mocks.landingZone.publishMetadata,
  ).then((r) => unwrap<PublishMetadataResult>(r));
