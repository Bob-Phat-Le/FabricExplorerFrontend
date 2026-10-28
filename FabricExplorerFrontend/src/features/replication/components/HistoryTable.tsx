import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { HISTORY, type ReplStatus } from '../constants';

type Filter = 'All' | ReplStatus;
const FILTERS: Filter[] = ['All', 'Running', 'Completed'];

export function HistoryTable() {
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>('All');
  const rows = HISTORY.filter((r) => filter === 'All' || r.status === filter);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Replication Streams</h3>
          <p className="text-[11px] text-slate-400">Active and past Open Mirroring configurations</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px]">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={
                  filter === f
                    ? 'px-2.5 py-1 rounded font-semibold text-indigo-600 bg-indigo-50'
                    : 'px-2.5 py-1 rounded text-slate-600 hover:bg-slate-50'
                }
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => showToast('Refreshed replication configurations', 'info')}
            className="p-1.5 border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 text-xs"
          >
            <i className="fa-solid fa-rotate-right" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <th className="p-3 pl-4">Database</th>
              <th className="p-3">Schema</th>
              <th className="p-3">Table</th>
              <th className="p-3">Format</th>
              <th className="p-3">Row Marker</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Activity</th>
              <th className="p-3 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {rows.map((r) => {
              const running = r.status === 'Running';
              return (
                <tr key={`${r.database}.${r.schema}.${r.table}`} className="hover:bg-slate-50">
                  <td className="p-3 pl-4 font-bold text-slate-900 font-mono">{r.database}</td>
                  <td className="p-3 font-mono">{r.schema}</td>
                  <td className="p-3 font-bold text-slate-900 font-mono">{r.table}</td>
                  <td className="p-3">{r.format}</td>
                  <td className={`p-3 ${r.rowMarker ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
                    {r.rowMarker ? 'Enabled' : 'Disabled'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${
                        running ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {running ? '● Running' : '✓ Completed'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{r.lastActivity}</td>
                  <td className="p-3 text-right pr-4">
                    <button type="button" onClick={() => showToast('Replication metrics details', 'info')} className="text-indigo-600 font-semibold">
                      View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
