import { API_CONFIG } from './config.js';

export class ApiError extends Error {
    constructor(message, { status = 0, code = null, details = null, traceId = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.traceId = traceId;
    }
}

function parseError(payload, status) {
    const err = payload?.error;
    if (err && typeof err === 'object') {
        return {
            message: err.message || `HTTP ${status}`,
            code: err.code ?? null,
            details: err.details ?? null,
            traceId: err.traceId ?? null,
        };
    }

    const fields = payload?.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)
        ? payload.errors : null;
    const firstFieldError = fields ? Object.values(fields).flat().filter(Boolean)[0] : null;
    return {
        message: firstFieldError ? String(firstFieldError) : (payload?.detail || payload?.title || `HTTP ${status}`),
        code: null,
        details: fields,
        traceId: payload?.traceId ?? null,
    };
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function request({ method = 'GET', path, query, body, headers = {}, signal }) {
    const url = new URL(API_CONFIG.baseUrl + path, window.location.origin);
    Object.entries(query || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    if (signal?.aborted) throw new ApiError('Request cancelled', { code: 'ABORTED' });

    const isForm = body instanceof FormData;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_CONFIG.timeoutMs);
    const onAbort = () => ctrl.abort();
    signal?.addEventListener('abort', onAbort, { once: true });

    let res;
    try {
        res = await fetch(url, {
            method,
            headers: {
                Accept: 'application/json',
                ...(body && !isForm ? { 'Content-Type': 'application/json' } : {}),
                ...API_CONFIG.getAuthHeaders(),
                ...headers,
            },
            body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
            signal: ctrl.signal,
        });
    } catch (e) {
        if (signal?.aborted) throw new ApiError('Request cancelled', { code: 'ABORTED' });
        throw new ApiError(
            e.name === 'AbortError'
                ? 'Request timed out'
                : `Cannot reach the server at ${API_CONFIG.baseUrl} (is the backend running and CORS enabled?)`,
            { code: 'NETWORK' }
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
    return payload;
}

export async function call(req, mockHandler) {
    if (API_CONFIG.useMock) {
        await sleep(API_CONFIG.mockLatencyMs);
        return structuredClone(await mockHandler(req));
    }
    const { meta, ...real } = req;
    return request(real);
}
