import { cn } from '@/lib/cn';
import { formatDateTime, timeAgo } from '@/lib/format';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import { targetIconOf } from '../targets/targetSources';

interface SavedQueryRowProps {
  query: SavedQuery;
  selected: boolean;
  /** Show the connection column (the list spans all connections). */
  showConnection: boolean;
  /** The row is waiting for the user to confirm its deletion. */
  confirmingDelete: boolean;
  deleting: boolean;
  onSelect: () => void;
  onCopy: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

const ICON_BUTTON = 'p-1 text-slate-400 transition-colors';

export function SavedQueryRow({
  query,
  selected,
  showConnection,
  confirmingDelete,
  deleting,
  onSelect,
  onCopy,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: SavedQueryRowProps) {
  const stamp = query.updatedAt ?? query.createdAt;

  return (
    <tr onClick={onSelect} className={cn('cursor-pointer align-top', selected ? 'bg-indigo-50/60' : 'hover:bg-slate-50')}>
      <td className="p-3 pl-6">
        <div className="font-bold text-slate-900 truncate max-w-[16rem]" title={query.name}>
          {query.name}
        </div>
        {query.description && <div className="text-[10px] text-slate-400 truncate max-w-[16rem]">{query.description}</div>}
      </td>
      <td className="p-3 text-slate-600">
        <span className="flex items-center space-x-1.5">
          <i className={`fa-solid ${targetIconOf(query.target.itemType)} text-indigo-500 text-[11px]`} />
          <span className="truncate max-w-[10rem]" title={query.target.itemName}>
            {query.target.itemName || '—'}
          </span>
        </span>
      </td>
      {showConnection && (
        <td className="p-3 text-slate-500">
          <span className="truncate block max-w-[9rem]" title={query.connectionName ?? ''}>
            {query.connectionName ?? <span className="text-rose-500">Missing</span>}
          </span>
        </td>
      )}
      <td className="p-3 text-slate-400 font-mono text-[11px] whitespace-nowrap" title={formatDateTime(stamp)}>
        {timeAgo(stamp)}
      </td>
      <td className="p-3 pr-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {confirmingDelete ? (
          <span className="inline-flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-rose-600">Delete?</span>
            <button
              type="button"
              disabled={deleting}
              onClick={onConfirmDelete}
              className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[11px] font-bold"
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={onCancelDelete}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold"
            >
              No
            </button>
          </span>
        ) : (
          <>
            <button type="button" onClick={onCopy} className={cn(ICON_BUTTON, 'hover:text-indigo-600')} title="Copy SQL" aria-label={`Copy SQL of ${query.name}`}>
              <i className="fa-regular fa-copy" />
            </button>
            <button
              type="button"
              onClick={onAskDelete}
              className={cn(ICON_BUTTON, 'hover:text-rose-600')}
              title="Delete saved query"
              aria-label={`Delete ${query.name}`}
            >
              <i className="fa-solid fa-trash-can" />
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
