import { formatDateTime } from '@/lib/format';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import { targetIconOf, targetLabelOf } from '../targets/targetSources';

interface SavedQueryPreviewProps {
  query: SavedQuery | null;
  /** Why the query cannot be loaded into the editor right now (null = it can). */
  blockedReason: string | null;
  onLoad: () => void;
  onCopy: () => void;
}

export function SavedQueryPreview({ query, blockedReason, onLoad, onCopy }: SavedQueryPreviewProps) {
  return (
    <div className="w-full md:w-[420px] bg-slate-900 text-emerald-400 p-4 flex flex-col border-t md:border-t-0 md:border-l border-slate-800 shrink-0 min-h-0">
      {query ? (
        <>
          <div className="border-b border-slate-800 pb-3 mb-3 text-slate-300 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white truncate" title={query.name}>
                {query.name}
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono shrink-0 flex items-center space-x-1">
                <i className={`fa-solid ${targetIconOf(query.target.itemType)} text-[9px]`} />
                <span className="truncate max-w-[9rem]">{query.target.itemName || targetLabelOf(query.target.itemType)}</span>
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-slate-400">
              <dt>Connection</dt>
              <dd className="text-slate-200 truncate text-right">{query.connectionName ?? '—'}</dd>
              <dt>Max rows</dt>
              <dd className="text-slate-200 font-mono text-right">{query.maxRows === null ? 'Unlimited' : query.maxRows.toLocaleString()}</dd>
              <dt>{query.updatedAt ? 'Updated' : 'Saved'}</dt>
              <dd className="text-slate-200 text-right">{formatDateTime(query.updatedAt ?? query.createdAt)}</dd>
            </dl>
            {query.description && <p className="text-[11px] text-slate-300 leading-relaxed">{query.description}</p>}
          </div>

          <div className="flex-1 min-h-[8rem] font-mono text-[11px] leading-relaxed overflow-auto bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
            <pre className="whitespace-pre-wrap text-emerald-400">{query.sql}</pre>
          </div>

          {blockedReason && (
            <p className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5 mb-3">
              <i className="fa-solid fa-triangle-exclamation mr-1.5" />
              {blockedReason}
            </p>
          )}

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              disabled={blockedReason !== null}
              onClick={onLoad}
              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
            >
              <i className="fa-solid fa-terminal" />
              <span>Load into Editor</span>
            </button>
            <button
              type="button"
              onClick={onCopy}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-lg transition-colors"
              title="Copy SQL"
              aria-label="Copy SQL"
            >
              <i className="fa-regular fa-copy" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 text-xs">
          <i className="fa-solid fa-code text-2xl mb-2" />
          Select a query to preview its SQL.
        </div>
      )}
    </div>
  );
}
