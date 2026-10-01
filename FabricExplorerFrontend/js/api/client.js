// HTTP client duy nhất của app. Mọi lời gọi backend đều đi qua request()/call().
import { API_CONFIG } from './config.js';

export class ApiError extends Error {
    constructor(message, { status = 0, code = null, details = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
    }
}

/**
 * Rút thông điệp lỗi từ body. Hỗ trợ cả { message } lẫn ProblemDetails của ASP.NET Core
 * ({ title, detail, errors: { Field: ["msg"] } }).
 */
function errorMessage(payload, status) {
    if (payload?.message) return payload.message;
    if (payload?.errors && typeof payload.errors === 'object') {
        const first = Object.values(payload.errors).flat().filter(Boolean)[0];
        if (first) return String(first);
    }
    return payload?.detail || payload?.title || `HTTP ${status}`;
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * @param {{method?:string, path:string, query?:object, body?:object|FormData, headers?:object, signal?:AbortSignal}} req
 * Backend nên trả lỗi dạng { message, code, details } để ApiError hiển thị đúng lên toast.
 */
export async function request({ method = 'GET', path, query, body, headers = {}, signal }) {
    // baseUrl có thể là tuyệt đối ('http://localhost:8080/api') hoặc tương đối ('/api').
    const url = new URL(API_CONFIG.baseUrl + path, window.location.origin);
    Object.entries(query || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });

    const isForm = body instanceof FormData;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), API_CONFIG.timeoutMs);
    signal?.addEventListener('abort', () => ctrl.abort());

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
        throw new ApiError(
            e.name === 'AbortError'
                ? 'Request timed out'
                : `Cannot reach the server at ${API_CONFIG.baseUrl} (is the backend running and CORS enabled?)`,
            { code: 'NETWORK' }
        );
    } finally {
        clearTimeout(timer);
    }

    const payload = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
        throw new ApiError(errorMessage(payload, res.status), {
            status: res.status,
            code: payload?.code ?? payload?.type ?? null,
            details: payload?.details ?? payload?.errors ?? null,
        });
    }
    return payload;
}

/** Chạy request thật, hoặc mockHandler khi API_CONFIG.useMock = true. `meta` chỉ dùng cho mock, không gửi đi. */
export async function call(req, mockHandler) {
    if (API_CONFIG.useMock) {
        await sleep(API_CONFIG.mockLatencyMs);
        return structuredClone(await mockHandler(req));
    }
    const { meta, ...real } = req;
    return request(real);
}
