import { useCallback, useEffect, useRef } from 'react';
import * as discoveryApi from '@/lib/api/discovery.api';
import type { StreamHandlers, Streamed } from '@/lib/api/stream';
import { useToast } from '@/providers/ToastProvider';

export type Guard = (() => boolean) & { signal: AbortSignal };

export function useRequestGuard() {
  const { showToast } = useToast();
  const seqs = useRef<Record<string, number>>({});
  const ctrls = useRef<Record<string, AbortController | undefined>>({});
  const streams = useRef(new Map<string, AbortController>());

  const stopStreams = useCallback((group: string) => {
    for (const [key, ctrl] of streams.current) {
      if (key === group || key.startsWith(`${group}#`)) {
        ctrl.abort();
        streams.current.delete(key);
      }
    }
  }, []);

  const latest = useCallback(
    (key: string): Guard => {
      stopStreams(key);
      ctrls.current[key]?.abort();
      const ctrl = (ctrls.current[key] = new AbortController());
      const n = (seqs.current[key] = (seqs.current[key] ?? 0) + 1);
      return Object.assign(() => seqs.current[key] === n, { signal: ctrl.signal });
    },
    [stopStreams],
  );

  const invalidate = useCallback(
    (...keys: string[]) => {
      keys.forEach((k) => {
        seqs.current[k] = (seqs.current[k] ?? 0) + 1;
        ctrls.current[k]?.abort();
        stopStreams(k);
      });
    },
    [stopStreams],
  );

  const followStream = useCallback(
    (key: string, live: Streamed<unknown> | undefined, handlers: StreamHandlers, onSettled?: (err?: unknown) => void) => {
      streams.current.get(key)?.abort();
      streams.current.delete(key);
      if (!live?.isStreaming) return;

      const ctrl = new AbortController();
      streams.current.set(key, ctrl);

      discoveryApi
        .openStream(live, handlers, { signal: ctrl.signal })
        .then(() => {
          if (!ctrl.signal.aborted) onSettled?.();
        })
        .catch((err: unknown) => {
          if (ctrl.signal.aborted) return;
          console.warn('Live update failed', err);
          showToast(`Live update failed: ${err instanceof Error && err.message ? err.message : 'unknown error'}`, 'warning');
          onSettled?.(err);
        })
        .finally(() => {
          if (streams.current.get(key) === ctrl) streams.current.delete(key);
        });
    },
    [showToast],
  );

  useEffect(() => {
    const allCtrls = ctrls.current;
    const allStreams = streams.current;
    const allSeqs = seqs.current;
    return () => {
      Object.keys(allSeqs).forEach((k) => (allSeqs[k] += 1));
      Object.values(allCtrls).forEach((c) => c?.abort());
      allStreams.forEach((c) => c.abort());
      allStreams.clear();
    };
  }, []);

  return { latest, invalidate, stopStreams, followStream };
}
