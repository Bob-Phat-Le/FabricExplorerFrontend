import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { ImportResponse } from '@/types/configuration';
import { ACTION_META, flagLabel, typeLabel } from '../../utils';
import { Badge } from '../Badge';

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
      <span className="text-slate-400 text-[10px] block">{label}</span>
      <span className={cn('text-base font-bold', color)}>{value}</span>
    </div>
  );
}

export function ResultsStep({ result }: { result: ImportResponse }) {
  const nothingDone = result.created + result.updated === 0;
  const state =
    result.failed > 0
      ? nothingDone
        ? { box: 'bg-rose-50 border-rose-200', dot: 'bg-rose-500', icon: 'fa-xmark', title: 'Import failed', text: 'text-rose-900', sub: 'text-rose-700' }
        : { box: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', icon: 'fa-exclamation', title: 'Import completed with errors', text: 'text-amber-900', sub: 'text-amber-700' }
      : { box: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', icon: 'fa-check', title: 'Import completed', text: 'text-emerald-900', sub: 'text-emerald-700' };

  const needCredentials = result.results.filter((r) => r.success && r.flags.includes('NeedsCredentials'));
  const savedQueries = result.results.filter((r) => r.type === 'SavedQuery' && r.success && (r.action === 'created' || r.action === 'updated'));

  return (
    <div className="space-y-4 text-xs">
      <div className={cn('border rounded-xl p-4 flex items-center space-x-3', state.box)}>
        <div className={cn('w-10 h-10 rounded-full text-white flex items-center justify-center text-lg shrink-0', state.dot)}>
          <i className={`fa-solid ${state.icon}`} />
        </div>
        <div>
          <h4 className={cn('font-bold text-sm', state.text)}>{state.title}</h4>
          <p className={cn('text-[11px]', state.sub)}>
            {result.created} created, {result.updated} updated, {result.skipped} skipped, {result.failed} failed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        <Counter label="Created" value={result.created} color="text-emerald-600" />
        <Counter label="Updated" value={result.updated} color="text-amber-600" />
        <Counter label="Skipped" value={result.skipped} color="text-slate-600" />
        <Counter label="Failed" value={result.failed} color="text-rose-600" />
      </div>

      {needCredentials.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-900 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-bold">
              <i className="fa-solid fa-key mr-1.5 text-indigo-600" />
              Client secret needed for {needCredentials.length} connection{needCredentials.length === 1 ? '' : 's'}
            </p>
            <p className="text-[11px]">
              {needCredentials.map((r) => r.name ?? r.key).join(', ')}. Make the connection active, then use <b>Edit</b> to enter its secret.
            </p>
          </div>
          <Link
            href="/connection"
            className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
          >
            Configure
          </Link>
        </div>
      )}

      {savedQueries.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="font-bold">
              <i className="fa-solid fa-terminal mr-1.5 text-indigo-600" />
              {savedQueries.length} saved quer{savedQueries.length === 1 ? 'y' : 'ies'} available in the Query Editor
            </p>
            <p className="text-[11px]">Open <b>Saved Queries</b> there to load them. A query is loaded for the connection it was saved for.</p>
          </div>
          <Link
            href="/catalog/query-editor"
            className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg transition-colors"
          >
            Open editor
          </Link>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-[40vh] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] sticky top-0">
              <tr>
                <th className="p-2.5 pl-4">Name</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Result</th>
                <th className="p-2.5 pr-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {result.results.map((r, i) => {
                const meta = ACTION_META[r.action] ?? { label: r.action, tone: 'slate' as const };
                return (
                  <tr key={`${r.type}-${r.key ?? i}`} className="align-top">
                    <td className="p-2.5 pl-4 font-semibold text-slate-900">{r.name ?? r.key ?? '—'}</td>
                    <td className="p-2.5 whitespace-nowrap">{typeLabel(r.type)}</td>
                    <td className="p-2.5">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </td>
                    <td className="p-2.5 pr-4 space-y-0.5">
                      {r.error && <p className="text-[11px] text-rose-700">{r.error.message}</p>}
                      {r.flags.map((f) => (
                        <p key={f} className="text-[11px] text-amber-700">
                          {flagLabel(f)}
                        </p>
                      ))}
                      {!r.error && r.flags.length === 0 && <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
