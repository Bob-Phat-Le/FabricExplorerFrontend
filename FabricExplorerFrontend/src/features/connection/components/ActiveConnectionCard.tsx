import type { Connection } from '@/types/connection';
import { tokenEndpointOf } from '../utils';

interface Props {
  active: Connection | null;
  onTest: () => void;
  onEdit: () => void;
}

export function ActiveConnectionCard({ active, onTest, onEdit }: Props) {
  const endpoint = tokenEndpointOf(active);

  return (
    <div className="bg-white rounded-xl border border-indigo-200 shadow-sm p-6 space-y-5 ring-1 ring-indigo-500/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center text-xl shadow-md shrink-0">
            <i className="fa-solid fa-plug-circle-check" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">{active?.name ?? 'No active connection'}</h2>
              {active?.environment && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  {active.environment}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Currently Active Connection · Microsoft Entra ID OAuth 2.0</p>
          </div>
        </div>
        {active && (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              Active Session
            </span>
          </div>
        )}
      </div>

      {/* Configured Active Credentials Details */}
      <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-1">
          <dt className="text-slate-400 font-medium flex items-center justify-between">
            <span>Target Workspace</span>
            <i className="fa-solid fa-cubes text-[11px] text-indigo-500" />
          </dt>
          <dd className="font-bold text-slate-900 truncate">{active ? active.workspaceName || active.workspaceId || '—' : '—'}</dd>
          <dd className="font-mono text-[10px] text-slate-400 truncate">{active?.workspaceId ?? '—'}</dd>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-1">
          <dt className="text-slate-400 font-medium flex items-center justify-between">
            <span>Token Endpoint</span>
            <i className="fa-solid fa-shield-halved text-[11px] text-slate-400" />
          </dt>
          <dd className="font-mono text-slate-800 truncate" title={endpoint}>
            {endpoint ? endpoint.replace(/^https?:\/\//, '') : '—'}
          </dd>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-1">
          <dt className="text-slate-400 font-medium">Client ID</dt>
          <dd className="font-mono text-slate-800 truncate">{active?.clientId ?? '—'}</dd>
        </div>

        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-1">
          <dt className="text-slate-400 font-medium flex items-center justify-between">
            <span>Client Secret</span>
            <i className="fa-solid fa-lock text-[11px] text-indigo-500" />
          </dt>
          <dd className="font-mono text-slate-500">••••••••••••••••••••••••</dd>
        </div>
      </dl>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 flex items-center space-x-1">
          <i className="fa-solid fa-circle-check text-emerald-500" />
          <span>Fabric Explorer API requests will run against this environment</span>
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onTest}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Test Connection
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-pen-to-square text-slate-400" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
