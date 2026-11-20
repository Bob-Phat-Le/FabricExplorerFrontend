'use client';

import { useCallback, useEffect, useState } from 'react';
import { listOperations } from '@/lib/api/landingZone.api';
import { formatDateTime } from '@/lib/format';
import type { LandingZoneOperation } from '@/types/landingZone';

const DEFAULT_LIMIT = 50;
const MIN_LIMIT = 1;
const MAX_LIMIT = 500;
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const clampLimit = (n: number) => Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.floor(n)));

interface Props {
  connectionId: string | null;
  /** change this value (e.g. the operations array of the hook) to reload the list after an action */
  refreshKey?: unknown;
}

export function OperationsPanel({ connectionId, refreshKey }: Props) {
  const [limit, setLimit] = useState(DEFAULT_LIMIT); // how many operations are requested from the server
  const [limitDraft, setLimitDraft] = useState(String(DEFAULT_LIMIT));
  const [pageSize, setPageSize] = useState(10); // rows per page
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LandingZoneOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      if (!connectionId) return;
      setLoading(true);
      setError(null);
      try {
        setItems(await listOperations(connectionId, limit, { signal }));
      } catch (e) {
        if (signal?.aborted) return;
        setError(e instanceof Error ? e.message : 'Could not load operations.');
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [connectionId, limit],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load, refreshKey]);

  const applyLimit = () => {
    const n = Number(limitDraft);
    const next = Number.isFinite(n) && limitDraft.trim() !== '' ? clampLimit(n) : DEFAULT_LIMIT;
    setLimitDraft(String(next));
    setPage(1);
    setLimit(next);
  };

  // the server may return more than `limit` (or mocks may ignore it), so cap on the client as well
  const visible = items.slice(0, limit);
  const total = visible.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * pageSize;
  const rows = visible.slice(startIdx, startIdx + pageSize);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* header */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-clock-rotate-left text-slate-400 text-xs" />
          <h2 className="text-sm font-bold text-slate-900">Recent Operations</h2>
          {loading && <i className="fa-solid fa-spinner fa-spin text-slate-400 text-[11px]" />}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <label className="flex items-center space-x-1.5">
            <span>List last</span>
            <input
              type="number"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              value={limitDraft}
              onChange={(e) => setLimitDraft(e.target.value)}
              onBlur={applyLimit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyLimit();
              }}
              className="w-16 px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200"
              aria-label="Number of operations to list"
            />
            <span>operations</span>
          </label>

          <label className="flex items-center space-x-1.5">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 rounded-md border border-slate-200 bg-white text-slate-700 font-semibold"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>

          <button type="button" disabled={loading} onClick={() => void load()} className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium flex items-center space-x-1.5">
            <i className="fa-solid fa-rotate" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* table */}
      {error ? (
        <div className="p-6 text-center text-xs text-rose-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3 font-semibold">Operation</th>
                <th className="p-3 font-semibold">Item</th>
                <th className="p-3 font-semibold">Path</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Details</th>
                <th className="p-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">{loading ? 'Loading…' : 'No operations yet.'}</td>
                </tr>
              )}
              {rows.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-semibold text-slate-800">{op.operation}</td>
                  <td className="p-3 text-slate-700">{op.item}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-500">{op.path}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        op.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : op.status === 'Failed'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {op.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate" title={op.details ?? ''}>{op.details ?? '—'}</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">{formatDateTime(op.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* footer / pagination */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
        <span>{total === 0 ? 'Showing 0 operations' : `Showing ${startIdx + 1}–${Math.min(startIdx + pageSize, total)} of ${total} operations`}</span>
        <div className="flex items-center space-x-1.5">
          <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium">
            Previous
          </button>
          <span className="px-2 font-mono font-semibold text-slate-700">Page {current} of {totalPages}</span>
          <button type="button" disabled={current >= totalPages} onClick={() => setPage(current + 1)} className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
