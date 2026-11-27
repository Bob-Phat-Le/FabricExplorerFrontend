import { API_CONFIG } from './config';
import { ApiError, call, parseError } from './client';
import { mocks } from '../mocks/handlers';
import type {
  ConfigurationCapabilities,
  ConfigurationFileDocument,
  ConfigurationHistoryItem,
  ConfigurationItem,
  ConfigurationItemsPage,
  ConfigurationItemsQuery,
  ExportRequest,
  ExportResult,
  ImportRequest,
  ImportResponse,
  PreviewResponse,
} from '@/types/configuration';

const BASE = '/configuration';

interface Opts {
  signal?: AbortSignal;
}

const unwrap = <T>(r: unknown): T =>
  (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r ? (r as { data: T }).data : r) as T;

/** Limits, supported format versions and entry types. */
export const getCapabilities = () =>
  call<unknown>({ method: 'GET', path: `${BASE}/capabilities` }, mocks.configuration.capabilities).then((r) =>
    unwrap<ConfigurationCapabilities>(r),
  );

interface PagedPayload {
  items?: ConfigurationItem[];
  pageInformation?: { page?: number; pageSize?: number; totalPages?: number; totalItems?: number };
}

/** Connections and saved queries as one inventory, filtered and paged on the server. */
export const listItems = (query: ConfigurationItemsQuery, { signal }: Opts = {}): Promise<ConfigurationItemsPage> =>
  call<unknown>(
    {
      method: 'GET',
      path: `${BASE}/items`,
      query: {
        page: query.page,
        pageSize: query.pageSize,
        type: query.type,
        status: query.status,
        search: query.search?.trim(),
      },
      signal,
    },
    mocks.configuration.items,
  ).then((r) => {
    const d = unwrap<ConfigurationItem[] | PagedPayload | null>(r);
    const items = Array.isArray(d) ? d : (d?.items ?? []);
    const pi = (Array.isArray(d) ? null : d?.pageInformation) ?? {};
    const pageSize = pi.pageSize ?? query.pageSize;
    const totalItems = pi.totalItems ?? items.length;
    return {
      items,
      page: pi.page ?? query.page,
      pageSize,
      totalItems,
      totalPages: pi.totalPages ?? Math.max(1, Math.ceil(totalItems / pageSize)),
    };
  });

/** Walks every page of a filter (used by "select all matching"). Page size is capped at 100 by the server. */
export async function listAllItems(query: Omit<ConfigurationItemsQuery, 'page' | 'pageSize'>, { signal }: Opts = {}) {
  const all: ConfigurationItem[] = [];
  let page = 1;
  for (;;) {
    const res = await listItems({ ...query, page, pageSize: 100 }, { signal });
    all.push(...res.items);
    if (page >= res.totalPages || res.items.length === 0) return all;
    page += 1;
  }
}

// ---------- export (returns a file, so it bypasses the JSON helper) ----------

const fallbackFileName = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `fabric-explorer-configuration-${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}.json`;
};

function fileNameFrom(disposition: string | null): string {
  if (!disposition) return fallbackFileName();
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ''));
    } catch {
      /* fall through */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1].trim() : fallbackFileName();
}

const headerInt = (res: Response, name: string) => {
  const raw = res.headers.get(name);
  const n = raw === null ? NaN : parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

export async function exportConfiguration(body: ExportRequest, { signal }: Opts = {}): Promise<ExportResult> {
  if (API_CONFIG.useMock) {
    const f = await mocks.configuration.exportFile(body);
    return {
      blob: new Blob([f.content], { type: 'application/json' }),
      fileName: f.fileName,
      exported: f.exported,
      skipped: 0,
    };
  }

  let res: Response;
  try {
    res = await fetch(new URL(API_CONFIG.baseUrl + `${BASE}/export`, window.location.origin), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...API_CONFIG.getAuthHeaders() },
      body: JSON.stringify(body),
      signal,
    });
  } catch {
    if (signal?.aborted) throw new ApiError('Request cancelled', { code: 'ABORTED' });
    throw new ApiError(`Cannot reach the server at ${API_CONFIG.baseUrl} (is the backend running and CORS enabled?)`, {
      code: 'NETWORK',
    });
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const { message, code, details, traceId } = parseError(payload, res.status);
    throw new ApiError(message, { status: res.status, code, details, traceId });
  }

  return {
    blob: await res.blob(),
    fileName: fileNameFrom(res.headers.get('Content-Disposition')),
    exported: headerInt(res, 'X-Configuration-Exported'),
    skipped: headerInt(res, 'X-Configuration-Skipped') ?? 0,
  };
}

// ---------- import ----------

/** Dry run: validates the file and matches it against existing data. Writes nothing. */
export const previewImport = (document: ConfigurationFileDocument, { signal }: Opts = {}) =>
  call<unknown>({ method: 'POST', path: `${BASE}/import/preview`, body: { document }, signal }, mocks.configuration.preview).then(
    (r) => unwrap<PreviewResponse>(r),
  );

/** `idempotencyKey` makes a retry of the same attempt return the first result instead of importing twice. */
export const importConfiguration = (body: ImportRequest, idempotencyKey: string) =>
  call<unknown>(
    { method: 'POST', path: `${BASE}/import`, body, headers: { 'Idempotency-Key': idempotencyKey } },
    mocks.configuration.import,
  ).then((r) => unwrap<ImportResponse>(r));

export const getHistory = (limit = 10) =>
  call<unknown>({ method: 'GET', path: `${BASE}/history`, query: { limit } }, mocks.configuration.history).then((r) => {
    const d = unwrap<ConfigurationHistoryItem[] | null>(r);
    return Array.isArray(d) ? d : [];
  });
