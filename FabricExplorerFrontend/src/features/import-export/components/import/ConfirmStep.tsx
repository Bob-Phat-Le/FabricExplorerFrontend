import type { ImportWizardState } from '../../hooks/useImportWizard';
import { typeLabel } from '../../utils';

function Counter({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`border p-3 rounded-xl ${tone}`}>
      <span className="text-slate-500 text-[11px] block">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

export function ConfirmStep({ w }: { w: ImportWizardState }) {
  const skipped = w.plan.filter((p) => p.action === 'skip');
  const updated = w.plan.filter((p) => p.action === 'update');

  return (
    <div className="space-y-4 text-xs">
      <h4 className="font-bold text-slate-900 uppercase tracking-wider">Confirm import</h4>

      <div className="grid grid-cols-3 gap-3">
        <Counter label="To create" value={w.planCounts.create} tone="bg-emerald-50 border-emerald-200 text-emerald-700" />
        <Counter label="To update" value={w.planCounts.update} tone="bg-amber-50 border-amber-200 text-amber-700" />
        <Counter label="To skip" value={w.planCounts.skip} tone="bg-slate-50 border-slate-200 text-slate-600" />
      </div>

      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
        <p>
          <span className="font-bold text-slate-800">Mode:</span>{' '}
          <span className="text-indigo-600 font-bold">{w.mode === 'merge' ? 'Merge with existing data' : 'Overwrite existing data'}</span>
        </p>
        <p>
          <span className="font-bold text-slate-800">Transaction:</span>{' '}
          <span className="text-slate-600">{w.atomic ? 'All or nothing' : 'Entry by entry'}</span>
        </p>
        {w.hasLandingZone && (
          <p>
            <span className="font-bold text-slate-800">Landing Zone:</span>{' '}
            <span className="text-slate-600">{w.restoreLandingZone ? 'Restored' : 'Not restored'}</span>
          </p>
        )}
      </div>

      {updated.length > 0 && (
        <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 space-y-1">
          <p className="font-bold text-amber-900">Will be overwritten</p>
          <ul className="text-[11px] text-amber-900 list-disc pl-5">
            {updated.slice(0, 8).map((p) => (
              <li key={`${p.entry.type}-${p.entry.key}`}>
                {p.entry.name} <span className="text-amber-700/70">({typeLabel(p.entry.type)})</span>
              </li>
            ))}
            {updated.length > 8 && <li>and {updated.length - 8} more…</li>}
          </ul>
        </div>
      )}

      {skipped.length > 0 && (
        <div className="border border-slate-200 rounded-xl p-3 space-y-1">
          <p className="font-bold text-slate-800">Will be skipped</p>
          <ul className="text-[11px] text-slate-600 list-disc pl-5">
            {skipped.slice(0, 8).map((p) => (
              <li key={`${p.entry.type}-${p.entry.key}`}>
                {p.entry.name} — {p.reason}
              </li>
            ))}
            {skipped.length > 8 && <li>and {skipped.length - 8} more…</li>}
          </ul>
        </div>
      )}

      {w.needCredentials.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-indigo-900 space-y-1">
          <p className="font-bold">
            <i className="fa-solid fa-key mr-1.5 text-indigo-600" />
            {w.needCredentials.length} connection{w.needCredentials.length === 1 ? '' : 's'} will need a client secret
          </p>
          <p className="text-[11px]">{w.needCredentials.map((p) => p.entry.name).join(', ')}. You can enter it on the Connection page after the import.</p>
        </div>
      )}

      {w.importError && (
        <div role="alert" className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-[11px]">
          <i className="fa-solid fa-circle-exclamation mr-1.5 text-rose-600" />
          {w.importError}
        </div>
      )}
    </div>
  );
}
