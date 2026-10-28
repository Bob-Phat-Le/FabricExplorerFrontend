import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as discoveryApi from '@/lib/api/discovery.api';
import { CHECKING } from '@/lib/api/stream';
import { EMPTY, formatDateTime, formatNumber, timeAgo } from '@/lib/format';
import { BUSY_CLASS, useBusy } from '@/hooks/useBusy';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/providers/ToastProvider';
import type { Lakehouse, LakehouseTable, TableStatsPatch } from '@/types/discovery';
import { TABLE_STATUS_TONE } from '../constants';
import { useDiscoveryContext } from '../hooks/useDiscoveryContext';
import { useRequestGuard } from '../hooks/useRequestGuard';
import { useResourceList, type ResourceConfig } from '../hooks/useResourceList';
import { ResourceSelect } from './ResourceSelect';
import { StatusBadge } from './StatusBadge';

const CONFIG: ResourceConfig<Lakehouse> = {
  noun: 'lakehouse',
  fetch: discoveryApi.listLakehouses,
  idOf: (i) => i.lakehouseId,
  nameOf: (i) => i.lakehouseName,
};

interface Selection {
  workspaceId: string;
  lakehouseId: string;
}

export function LakehousePanel({ active }: { active: boolean }) {
  const router = useRouter();
  const { showToast, showApiError } = useToast();
  const { requireContext } = useDiscoveryContext();
  const { latest, invalidate, stopStreams, followStream } = useRequestGuard();
  const { isBusy, withBusy } = useBusy();

  const [tables, setTables] = useState<LakehouseTable[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [search, setSearch] = useState('');

  const selection = useRef<Selection | null>(null);
  const nextTokenRef = useRef<string | null>(null);
  const tableStreamSeq = useRef(0);

  const updateNextToken = (token: string | null) => {
    nextTokenRef.current = token;
    setNextToken(token);
  };

  const resetResults = useCallback(() => {
    invalidate('tables');
    stopStreams('tablesLive');
    setShowGrid(false);
    setTables([]);
    nextTokenRef.current = null;
    setNextToken(null);
    selection.current = null;
  }, [invalidate, stopStreams]);

  const list = useResourceList(CONFIG, active, resetResults);

  const trackTableStats = (live: Parameters<typeof followStream>[1], pageItems: LakehouseTable[]) => {
    if (!live?.isStreaming) return;
    const names = new Set(pageItems.map((t) => t.name));

    followStream(
      `tablesLive#${++tableStreamSeq.current}`,
      live,
      {
        'table-stats': (patch: TableStatsPatch) => {
          if (!names.has(patch.name)) return;
          setTables((prev) => prev.map((t) => (t.name === patch.name ? { ...t, ...patch } : t)));
        },
      },
      () =>
        setTables((prev) =>
          prev.map((t) =>
            names.has(t.name) && t.status === CHECKING ? { ...t, status: 'Unknown', statusMessage: 'Statistics are unavailable.' } : t,
          ),
        ),
    );
  };

  const loadTables = async ({ append, refresh = false }: { append: boolean; refresh?: boolean }) => {
    const ctx = requireContext();
    if (!ctx) return;

    let sel = append ? selection.current : null;
    if (!sel) {
      const item = list.getSelected();
      if (!item) return;
      sel = { workspaceId: item.workspaceId, lakehouseId: item.lakehouseId };
    }

    const target: Selection = sel;
    const isCurrent = latest('tables');
    if (!append) stopStreams('tablesLive');

    await withBusy(append ? 'more' : ['list', 'refresh'], async () => {
      try {
        const page = await discoveryApi.listLakehouseTables({
          ...ctx,
          ...target,
          continuationToken: append ? nextTokenRef.current : undefined,
          refresh,
          signal: isCurrent.signal,
        });
        if (!isCurrent()) return;

        selection.current = target;
        setTables((prev) => (append ? prev.concat(page.items) : page.items));
        updateNextToken(page.nextToken);
        setShowGrid(true);
        trackTableStats(page.live, page.items);
        if (!append) {
          const n = page.items.length;
          showToast(`Retrieved ${n}${page.nextToken ? '+' : ''} table${n === 1 ? '' : 's'} for Lakehouse`, 'info');
        }
      } catch (err) {
        if (isCurrent()) showApiError(err, 'Could not list tables');
      }
    });
  };

  const term = search.trim().toLowerCase();
  const rows = term ? tables.filter((t) => t.name?.toLowerCase().includes(term)) : tables;

  return (
    <div className={`${active ? '' : 'hidden'} space-y-6`}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <ResourceSelect id="lakehouseSelect" label="Lakehouse" list={list} onSelectionChange={resetResults} />

        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <i className="fa-solid fa-download" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Load Table</h4>
                  <p className="text-[11px] text-slate-500">Load a table from selected Lakehouse</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push('/ingestion')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                Load Table
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <i className="fa-solid fa-list-check" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">List Tables</h4>
                  <p className="text-[11px] text-slate-500">View all tables available in Lakehouse</p>
                </div>
              </div>
              <button
                type="button"
                disabled={isBusy('list')}
                onClick={() => void loadTables({ append: false })}
                className={`w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-colors ${isBusy('list') ? BUSY_CLASS : ''}`}
              >
                List Tables
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lakehouse Result Grid */}
      {showGrid && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-64">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tables..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                disabled={isBusy('refresh')}
                onClick={() => void loadTables({ append: false, refresh: true })}
                className={`px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-600 text-xs font-semibold hover:bg-slate-50 flex items-center space-x-1.5 ${isBusy('refresh') ? BUSY_CLASS : ''}`}
              >
                <i className="fa-solid fa-rotate-right text-slate-400" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3 pl-4">Table</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Rows</th>
                  <th className="p-3">Last Modified</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      {tables.length ? 'No tables match your search.' : 'No tables found in this lakehouse.'}
                    </td>
                  </tr>
                ) : (
                  rows.map((t) => {
                    const checking = t.status === CHECKING;
                    return (
                      <tr key={t.name} className="hover:bg-slate-50">
                        <td className="p-3 pl-4 font-bold text-slate-900">{t.name}</td>
                        <td className="p-3 font-mono">
                          {t.format || t.type || EMPTY}
                          {t.format && t.type && <span className="text-slate-400"> {t.type}</span>}
                        </td>
                        <td className="p-3 font-mono">{checking ? <Skeleton width="w-12" /> : formatNumber(t.rowCount)}</td>
                        <td className="p-3 text-slate-500" title={checking ? '' : formatDateTime(t.lastModifiedTime)}>
                          {checking ? <Skeleton width="w-16" /> : timeAgo(t.lastModifiedTime)}
                        </td>
                        <td className="p-3">
                          <StatusBadge label={t.status || 'Unknown'} tone={TABLE_STATUS_TONE[t.status] ?? 'muted'} title={t.statusMessage ?? ''} />
                        </td>
                        <td className="p-3 text-right pr-4">
                          <button
                            type="button"
                            onClick={() => showToast(`Inspecting table ${t.name}`, 'info')}
                            className="text-indigo-600 font-semibold hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>
              {`Showing ${rows.length} of ${tables.length} loaded table${tables.length === 1 ? '' : 's'}${nextToken ? ' (more available)' : ''}`}
            </span>
            {nextToken && (
              <button
                type="button"
                disabled={isBusy('more')}
                onClick={() => void loadTables({ append: true })}
                className={`px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-slate-600 font-semibold hover:bg-slate-50 ${isBusy('more') ? BUSY_CLASS : ''}`}
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
