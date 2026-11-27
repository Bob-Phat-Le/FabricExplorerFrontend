import { timeAgo, formatDateTime } from '@/lib/format';
import type { ConfigurationHistoryItem } from '@/types/configuration';
import { Badge } from './Badge';

export function HistoryPanel({ items, loading }: { items: ConfigurationHistoryItem[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
      <div>
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent activity</h3>
        <p className="text-xs text-slate-500">Your latest imports and exports.</p>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl p-4 text-center">
          {loading ? 'Loading…' : 'No import or export yet.'}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((h) => {
            const isImport = h.kind.toLowerCase().includes('import');
            const failed = h.status.toLowerCase().startsWith('fail');
            return (
              <li key={h.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                    <i className={`fa-solid ${isImport ? 'fa-file-import' : 'fa-file-export'} text-[11px]`} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{h.summary ?? `${h.kind} ${h.status}`}</p>
                    <p className="text-[11px] text-slate-400" title={formatDateTime(h.createdAt)}>
                      {timeAgo(h.createdAt)} · {h.itemCount} item{h.itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <Badge tone={failed ? 'rose' : 'emerald'}>{h.status}</Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
