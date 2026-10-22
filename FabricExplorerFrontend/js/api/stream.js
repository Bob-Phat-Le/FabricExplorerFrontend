import { API_CONFIG } from './config.js';
import { ApiError, parseError, sleep } from './client.js';

/** Giá trị tạm backend gán cho trường chuỗi/enum đang chờ dữ liệu streaming. */
export const CHECKING = 'Checking';

const MAX_RECONNECTS = 3;
const lowerFirst = s => (s ? s[0].toLowerCase() + s.slice(1) : s);

/**
 * Chuẩn hoá `data` của endpoint có thể stream (EventStreamingAdapter<T>) về:
 *   { data, streamId, pendingFields, isStreaming }
 * `data` là DTO gốc; trường chưa có mang "Checking" (chuỗi/enum) hoặc null/0 (số/ngày, xem pendingFields).
 * Nếu backend chưa nâng cấp (trả DTO trần) thì coi như không có stream, UI vẫn chạy như cũ.
 */
export function asStreamed(payload) {
    if (payload && typeof payload === 'object' && 'innerData' in payload && 'isEventStreaming' in payload) {
        const streamId = payload.streamId ?? null;
        return {
            data: payload.innerData,
            streamId,
            pendingFields: (payload.pendingFields ?? []).map(lowerFirst),
            isStreaming: Boolean(payload.isEventStreaming && streamId),
        };
    }
    return { data: payload, streamId: null, pendingFields: [], isStreaming: false };
}

function parseFrame(raw) {
    let id = null;
    let event = 'message';
    const data = [];
    for (const line of raw.split(/\r?\n/)) {
        if (!line || line.startsWith(':')) continue; // comment / heartbeat
        const sep = line.indexOf(':');
        const field = sep === -1 ? line : line.slice(0, sep);
        let value = sep === -1 ? '' : line.slice(sep + 1);
        if (value.startsWith(' ')) value = value.slice(1);
        if (field === 'id') id = value;
        else if (field === 'event') event = value;
        else if (field === 'data') data.push(value);
    }
    return data.length ? { id, event, data: data.join('\n') } : null;
}

const cancelled = () => new ApiError('Request cancelled', { code: 'ABORTED' });
const networkError = message => new ApiError(message, { code: 'NETWORK' });

/** Một lần kết nối. Trả true nếu stream đã kết thúc (completed hoặc 204), false nếu server đóng giữa chừng. */
async function readOnce(streamId, lastEventId, onFrame, signal) {
    // Dùng query thay vì header Last-Event-ID: header này không nằm trong danh sách CORS-safelisted của fetch
    const url = new URL(`${API_CONFIG.baseUrl}/event-streams/${encodeURIComponent(streamId)}`, window.location.origin);
    if (lastEventId) url.searchParams.set('lastEventId', lastEventId);

    let res;
    try {
        res = await fetch(url, { headers: { Accept: 'text/event-stream', ...API_CONFIG.getAuthHeaders() }, signal });
    } catch (e) {
        if (signal?.aborted) throw e;
        throw networkError(`Cannot reach the server at ${API_CONFIG.baseUrl}`);
    }

    if (res.status === 204) return true; // đã kết thúc và client đã nhận hết
    if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const { message, code, details, traceId } = parseError(payload, res.status);
        throw new ApiError(message, { status: res.status, code, details, traceId });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
        for (;;) {
            let chunk;
            try {
                chunk = await reader.read();
            } catch (e) {
                if (signal?.aborted) throw e;
                throw networkError('Live connection lost');
            }
            if (chunk.done) return false;

            buffer += decoder.decode(chunk.value, { stream: true });
            let boundary;
            while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
                const raw = buffer.slice(0, boundary.index);
                buffer = buffer.slice(boundary.index + boundary[0].length);
                const frame = parseFrame(raw);
                if (frame && onFrame(frame) === true) return true;
            }
        }
    } finally {
        reader.cancel().catch(() => {});
    }
}

/** Đọc stream; tự nối lại (resume bằng lastEventId) khi mất kết nối giữa chừng. */
async function readEventStream(streamId, onFrame, signal) {
    let lastEventId = 0;
    let failures = 0;
    for (;;) {
        if (signal?.aborted) throw cancelled();
        try {
            const finished = await readOnce(streamId, lastEventId, frame => {
                if (frame.id) lastEventId = Number(frame.id) || lastEventId;
                return onFrame(frame);
            }, signal);
            if (finished) return;
            throw networkError('Live connection closed unexpectedly');
        } catch (err) {
            if (signal?.aborted) throw cancelled();
            if (!(err instanceof ApiError && err.code === 'NETWORK') || ++failures > MAX_RECONNECTS) throw err;
            await sleep(1000 * failures);
        }
    }
}

/**
 * Nhận các sự kiện của một stream và gọi `handlers[tênSựKiện](payload)`.
 * Resolve khi nhận "completed"; reject ApiError khi server gửi "error", stream hết hạn (404) hoặc mất kết nối quá nhiều lần.
 * Khi `signal` bị abort thì reject ApiError code 'ABORTED' (caller nên bỏ qua).
 */
export async function openStream(streamed, handlers = {}, { signal, mockPlayer } = {}) {
    if (!streamed?.isStreaming) return;

    // trả true = kết thúc
    const dispatch = (name, raw) => {
        if (name === 'completed') return true;

        let payload;
        try {
            payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        } catch {
            console.warn(`Ignoring malformed "${name}" event`, raw);
            return false;
        }

        if (name === 'error') throw new ApiError(payload?.message || 'Live update failed', { code: payload?.code ?? null });
        handlers[name]?.(payload);
        return false;
    };

    if (API_CONFIG.useMock) {
        await mockPlayer?.(streamed.streamId, dispatch, signal);
        return;
    }
    await readEventStream(streamed.streamId, frame => dispatch(frame.event, frame.data), signal);
}
