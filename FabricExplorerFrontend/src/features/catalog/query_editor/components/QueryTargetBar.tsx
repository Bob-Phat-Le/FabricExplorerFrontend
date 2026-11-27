import Link from 'next/link';
import { PanelMessage, SECONDARY_BUTTON } from '@/features/catalog/table/components/PanelMessage';
import { useClipboard } from '@/hooks/useClipboard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import type { QueryTargetsState } from '../hooks/QueryTargetsState';
import { TARGET_SOURCES } from '../targets/targetSources';
import { QueryTargetPicker } from './QueryTargetPicker';

const CARD = 'bg-white rounded-xl border border-slate-200 shadow-sm p-4';
const PRIMARY_BUTTON =
  'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-2';
const CHANGE_BUTTON =
  'px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1.5';

interface QueryTargetBarProps {
  targets: QueryTargetsState;
  target: QueryTargetItem | null;
  onSelect: (item: QueryTargetItem) => void;
}

/** The Fabric item the query runs against (and is saved for). */
export function QueryTargetBar({ targets, target, onSelect }: QueryTargetBarProps) {
  const copy = useClipboard();

  if (!targets.hasConnection) {
    return (
      <div className={CARD}>
        <PanelMessage
          fill
          icon="fa-plug"
          title="No active connection"
          action={
            <Link href="/connection" className={SECONDARY_BUTTON}>
              <i className="fa-solid fa-plug text-indigo-600" />
              <span>Open Connection</span>
            </Link>
          }
        >
          Set an active connection to choose the item a query runs against.
        </PanelMessage>
      </div>
    );
  }

  if (targets.state === 'error') {
    return (
      <div className={CARD}>
        <PanelMessage
          fill
          tone="error"
          icon="fa-triangle-exclamation"
          title="Could not load Fabric items"
          action={
            <button type="button" onClick={() => void targets.reload()} className={SECONDARY_BUTTON}>
              <i className="fa-solid fa-rotate-right text-slate-400" />
              <span>Try again</span>
            </button>
          }
        >
          {targets.error}
        </PanelMessage>
      </div>
    );
  }

  if (targets.state === 'loading' && !target) {
    return (
      <div className={`${CARD} flex items-center space-x-3.5`}>
        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
        <div className="space-y-2">
          <Skeleton width="w-48" />
          <Skeleton width="w-72" />
        </div>
      </div>
    );
  }

  if (!target) {
    return (
      <div className={CARD}>
        <div className="p-6 text-center bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-sm">
            <i className="fa-solid fa-cubes" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Select a Target Query Item</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {targets.items.length === 0
                ? 'No lakehouse, warehouse or mirrored database was found in this workspace.'
                : 'Choose an existing Microsoft Fabric artifact to execute SQL queries.'}
            </p>
          </div>
          {targets.items.length > 0 && (
            <div className="flex justify-center">
              <QueryTargetPicker items={targets.items} selectedId={null} onSelect={onSelect} buttonClassName={PRIMARY_BUTTON}>
                <i className="fa-solid fa-magnifying-glass" />
                <span>Select Existing Item</span>
                <i className="fa-solid fa-chevron-down text-[10px]" />
              </QueryTargetPicker>
            </div>
          )}
        </div>
      </div>
    );
  }

  const meta = TARGET_SOURCES[target.type];

  return (
    <div className={`${CARD} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shrink-0">
          <i className={`fa-solid ${meta?.icon ?? 'fa-cube'}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{target.name}</h3>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {meta?.label ?? target.type}
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
            <span>
              Workspace: <strong className="text-slate-800">{target.workspaceName ?? '—'}</strong>
            </span>
            <span aria-hidden>•</span>
            <span className="flex items-center space-x-1.5">
              <span>Item ID:</span>
              <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{target.id}</code>
              <button
                type="button"
                onClick={() => void copy(target.id, 'Item ID copied')}
                className="text-slate-400 hover:text-indigo-600"
                title="Copy Item ID"
                aria-label="Copy Item ID"
              >
                <i className="fa-regular fa-copy text-xs" />
              </button>
            </span>
          </div>
        </div>
      </div>

      {targets.items.length > 0 && (
        <div className="shrink-0">
          <QueryTargetPicker items={targets.items} selectedId={target.id} onSelect={onSelect} buttonClassName={CHANGE_BUTTON} align="right">
            <i className="fa-solid fa-arrow-right-arrow-left text-slate-400" />
            <span>Change Item</span>
          </QueryTargetPicker>
        </div>
      )}
    </div>
  );
}
