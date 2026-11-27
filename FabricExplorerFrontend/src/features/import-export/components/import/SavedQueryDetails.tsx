import { targetIconOf, targetLabelOf } from '@/features/catalog/query_editor/targets/targetSources';
import type { FileSavedQuery } from '@/types/FileSavedQuery';

/** What a saved query of the file is about: its target item, row limit and (expandable) SQL. */
export function SavedQueryDetails({ query }: { query: FileSavedQuery }) {
  const itemType = query.target?.itemType ?? '';
  const itemName = query.target?.itemName;

  return (
    <div className="mt-0.5 space-y-1 font-normal">
      <p className="text-[11px] text-slate-500 flex items-center flex-wrap gap-x-2">
        <span className="inline-flex items-center space-x-1">
          <i className={`fa-solid ${targetIconOf(itemType)} text-indigo-500 text-[10px]`} />
          <span>{itemName ? `${targetLabelOf(itemType) || 'Item'}: ${itemName}` : 'No target item'}</span>
        </span>
        <span aria-hidden>·</span>
        <span className="font-mono">Max rows: {query.maxRows == null ? 'Unlimited' : query.maxRows.toLocaleString()}</span>
      </p>

      {query.sql && (
        <details className="text-[11px]">
          <summary className="cursor-pointer text-indigo-600 hover:underline select-none">View SQL</summary>
          <pre className="mt-1 font-mono text-[11px] leading-relaxed text-emerald-400 bg-slate-900 rounded-lg p-2 max-h-40 overflow-auto whitespace-pre-wrap">
            {query.sql}
          </pre>
        </details>
      )}
    </div>
  );
}
