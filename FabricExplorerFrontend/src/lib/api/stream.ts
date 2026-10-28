import { API_CONFIG } from './config';
import { ApiError, parseError, sleep } from './client';

export const CHECKING = 'Checking';

const MAX_RECONNECTS = 3;
const lowerFirst = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

export interface Streamed<T> {
  data: T;
  streamId: string | null;
  pendingFields: string[];
  isStreaming: boolean;
}

interface StreamEnvelope<T> {
  isEventStreaming: boolean;
  streamId?: string | null;
  pendingFields?: string[];
  innerData: T;
}

export function asStreamed<T>(payload: unknown): Streamed<T> {
  if (payload && typeof payload === 'object' && 'innerData' in payload && 'isEventStreaming' in payload) {
    const env = payload as StreamEnvelope<T>;
    const streamId = env.streamId ?? null;
    return {
      data: env.innerData,
      streamId,
      pendingFields: (env.pendingFields ?? []).map(lowerFirst),
      isStreaming: Boolean(env.isEventStreaming && streamId),
    };
  }
  return { data: payload as T, streamId: null, pendingFields: [], isStreaming: false };
}

interface Frame {
  id: string | null;
  event: string;
  data: string;
}

function parseFrame(raw: string): Frame | null {
  let id: string | null = null;
  let event = 'message';
  const data: string[] = [];
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
const networkError = (message: string) => new ApiError(message, { code: 'NETWORK' });

async function readOnce(
  streamId: string,
  lastEventId: number,
  onFrame: (frame: Frame) => boolean | void,
  signal?: AbortSignal,
): Promise<boolean> {
  const url = new URL(`${API_CONFIG.baseUrl}/event-streams/${encodeURIComponent(streamId)}`, window.location.origin);
  if (lastEventId) url.searchParams.set('lastEventId', String(lastEventId));

  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: 'text/event-stream', ...API_CONFIG.getAuthHeaders() }, signal });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw networkError(`Cannot reach the server at ${API_CONFIG.baseUrl}`);
  }

  if (res.status === 204) return true;
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const { message, code, details, traceId } = parseError(payload, res.status);
    throw new ApiError(message, { status: res.status, code, details, traceId });
  }
  if (!res.body) throw networkError('Live connection has no body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      let chunk: ReadableStreamReadResult<Uint8Array>;
      try {
        chunk = await reader.read();
      } catch (e) {
        if (signal?.aborted) throw e;
        throw networkError('Live connection lost');
      }
      if (chunk.done) return false;

      buffer += decoder.decode(chunk.value, { stream: true });
      let boundary: RegExpExecArray | null;
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

async function readEventStream(streamId: string, onFrame: (frame: Frame) => boolean, signal?: AbortSignal) {
  let lastEventId = 0;
  let failures = 0;
  for (;;) {
    if (signal?.aborted) throw cancelled();
    try {
      const finished = await readOnce(
        streamId,
        lastEventId,
        (frame) => {
          if (frame.id) lastEventId = Number(frame.id) || lastEventId;
          return onFrame(frame);
        },
        signal,
      );
      if (finished) return;
      throw networkError('Live connection closed unexpectedly');
    } catch (err) {
      if (signal?.aborted) throw cancelled();
      if (!(err instanceof ApiError && err.code === 'NETWORK') || ++failures > MAX_RECONNECTS) throw err;
      await sleep(1000 * failures);
    }
  }
}

export type StreamHandlers = Record<string, ((payload: never) => void) | undefined>;
export type StreamDispatch = (name: string, raw: unknown) => boolean;
export type MockStreamPlayer = (streamId: string, dispatch: StreamDispatch, signal?: AbortSignal) => Promise<void>;

export async function openStream(
  streamed: Streamed<unknown> | undefined,
  handlers: StreamHandlers = {},
  { signal, mockPlayer }: { signal?: AbortSignal; mockPlayer?: MockStreamPlayer } = {},
): Promise<void> {
  if (!streamed?.isStreaming || !streamed.streamId) return;

  // trả true = kết thúc
  const dispatch: StreamDispatch = (name, raw) => {
    if (name === 'completed') return true;

    let payload: unknown;
    try {
      payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      console.warn(`Ignoring malformed "${name}" event`, raw);
      return false;
    }

    if (name === 'error') {
      const p = payload as { message?: string; code?: string } | null;
      throw new ApiError(p?.message || 'Live update failed', { code: p?.code ?? null });
    }
    handlers[name]?.(payload as never);
    return false;
  };

  if (API_CONFIG.useMock) {
    await mockPlayer?.(streamed.streamId, dispatch, signal);
    return;
  }
  await readEventStream(streamed.streamId, (frame) => dispatch(frame.event, frame.data), signal);
}
