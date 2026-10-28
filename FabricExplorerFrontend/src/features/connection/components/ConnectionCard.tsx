import { cn } from '@/lib/cn';
import type { Connection } from '@/types/connection';

interface Props {
  connection: Connection;
  active: boolean;
  onActivate: () => void;
}

export function ConnectionCard({ connection, active, onActivate }: Props) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        active
          ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm',
      )}
    >
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm shrink-0',
              active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            <i className={cn('fa-solid', active ? 'fa-plug-circle-check' : 'fa-plug')} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-xs">{connection.name}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]">
              {connection.workspaceName || connection.workspaceId}
            </p>
          </div>
        </div>
        {active ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
            Active
          </span>
        ) : (
          <button
            type="button"
            onClick={onActivate}
            className="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-400 text-slate-600 text-[11px] font-semibold rounded-lg"
          >
            Set Active
          </button>
        )}
      </div>
    </div>
  );
}
