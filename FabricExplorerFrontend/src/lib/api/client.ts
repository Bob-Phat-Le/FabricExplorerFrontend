import { API_CONFIG } from './config';

export interface ApiErrorInit {
  status?: number;
  code?: string | null;
  details?: unknown;
  traceId?: string | null;
}

export class ApiError extends Error {
  status: number;
  code: string | null;
  details: unknown;
  traceId: string | null;

  constructor(message: string, { status = 0, code = null, details = null, traceId = null }: ApiErrorInit = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.traceId = traceId;
  }
}

interface ErrorPayload {
  error?: { message?: string; code?: string; details?: unknown; traceId?: string } | string;
  errors?: Record<string, unknown> | unknown[];
  detail?: string;
  title?: string;
  traceId?: string;
}

export function parseError(payload: ErrorPayload | null, status: number) {
  const err = payload?.error;
  if (err && typeof err === 'object') {
    return {
      message: err.message || `HTTP ${status}`,
      code: err.code ?? null,
      details: err.details ?? null,
      traceId: err.traceId ?? null,
    };
  }

  const fields =
    payload?.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)
      ? (payload.errors as Record<string, unknown>)
      : null;
  const firstFieldError = fields ? Object.values(fields).flat().filter(Boolean)[0] : null;
  return {
    message: firstFieldError ? String(firstFieldError) : payload?.detail || payload?.title || `HTTP ${status}`,
    code: null,
    details: fields,
    traceId: payload?.traceId ?? null,
  };
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  meta?: Record<string, unknown>;
}

export type MockHandler<T> = (req: RequestOptions) => T | Promise<T>;

export async function request<T>({ method = 'GET', path, query, body, headers = {}, signal }: RequestOptions): Promise<T> {
  const url = new URL(API_CONFIG.baseUrl + path, window.location.origin);
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  if (signal?.aborted) throw new ApiError('Request cancelled', { code: 'ABORTED' });

  const isForm = body instanceof FormData;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_CONFIG.timeoutMs);
  const onAbort = () => ctrl.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...API_CONFIG.getAuthHeaders(),
        ...headers,
      },
      body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
      signal: ctrl.signal,
    });
  } catch (e) {
    if (signal?.aborted) throw new ApiError('Request cancelled', { code: 'ABORTED' });
    const timedOut = e instanceof Error && e.name === 'AbortError';
    throw new ApiError(
      timedOut
        ? 'Request timed out'
        : `Cannot reach the server at ${API_CONFIG.baseUrl} (is the backend running and CORS enabled?)`,
      { code: 'NETWORK' },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  const payload = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const { message, code, details, traceId } = parseError(payload, res.status);
    throw new ApiError(message, { status: res.status, code, details, traceId });
  }
  return payload as T;
}

export async function call<T>(req: RequestOptions, mockHandler: MockHandler<T>): Promise<T> {
  if (API_CONFIG.useMock) {
    await sleep(API_CONFIG.mockLatencyMs);
    return structuredClone(await mockHandler(req));
  }
  const real: RequestOptions = { ...req };
  delete real.meta;
  return request<T>(real);
}
