import { cn } from '@/lib/cn';
import type { PreviewEntry } from '@/types/configuration';
import { flagLabel, matchLabel, typeLabel } from '../../utils';
import type { ImportWizardState } from '../../hooks/useImportWizard';
import { Badge } from '../Badge';
import { SavedQueryDetails } from './SavedQueryDetails';

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={cn('border rounded-xl px-3 py-2', tone)}>
      <span className="text-[10px] block opacity-70">{label}</span>
      <span className="text-base font-bold font-mono">{value}</span>
    </div>
  );
}

export function ReviewStep({ w }: { w: ImportWizardState }) {
  const preview = w.preview;
  if (!preview) return null;

  const selectable = w.entries.filter(w.isValid).length;

  const mapSelect = (entry: PreviewEntry) => {
    const ck = w.connectionKeyOf(entry);
    if (!ck || !entry.validation.errors.some((e) => e.code === 'reference_unresolved')) return null;
    return (
      <label className="block mt-1.5">
        <span className="text-[10px] text-slate-500 block mb-0.5">Use an existing connection instead:</span>
        <select
          value={w.mappings[ck] ?? ''}
          onChange={(e) => w.setMapping(ck, e.target.value)}
          className="w-full max-w-[16rem] text-[11px] px-2 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="">— Not mapped —</option>
          {w.existingConnections.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <Stat label="In file" value={w.stats.total} tone="bg-slate-50 border-slate-200 text-slate-700" />
        <Stat label="New" value={w.stats.isNew} tone="bg-emerald-50 border-emerald-200 text-emerald-700" />
        <Stat label="Already exist" value={w.stats.existing} tone="bg-amber-50 border-amber-200 text-amber-700" />
        <Stat label="Invalid" value={w.stats.invalid} tone="bg-rose-50 border-rose-200 text-rose-700" />
      </div>

      {!preview.integrityValid && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 space-y-2">
          <div className="flex items-center space-x-2 font-bold">
            <i className="fa-solid fa-triangle-exclamation text-amber-600" />
            <span>Integrity check failed</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            The file does not match its checksum. It may be damaged or may have been edited by hand. Review the entries carefully.
          </p>
          <label className="flex items-center space-x-2 text-[11px] font-semibold cursor-pointer">
            <input type="checkbox" checked={w.ignoreIntegrity} onChange={(e) => w.setOption('ignoreIntegrity', e.target.checked)} />
            <span>I understand, continue anyway</span>
          </label>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider">Entries found in file</h4>
        <div className="flex items-center space-x-2">
          <button type="button" onClick={() => w.selectAllValid(true)} className="text-indigo-600 font-bold hover:underline">
            Select all valid
          </button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={() => w.selectAllValid(false)} className="text-slate-500 hover:underline">
            Deselect all
          </button>
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="max-h-[45vh] overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] sticky top-0">
              <tr>
                <th className="p-2.5 pl-4 w-10" />
                <th className="p-2.5">Name</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">In this system</th>
                <th className="p-2.5 pr-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {w.entries.map((entry, i) => {
                const valid = w.isValid(entry);
                const errors = w.openErrors(entry);
                const match = matchLabel(entry.match);
                const savedQuery = w.savedQueryOf(entry);
                return (
                  <tr key={`${entry.type}-${entry.key ?? i}`} className={cn('align-top', !valid && 'bg-rose-50/30')}>
                    <td className="p-2.5 pl-4">
                      <input
                        type="checkbox"
                        aria-label={`Import ${entry.name ?? entry.key}`}
                        disabled={!valid}
                        checked={valid && w.isSelected(entry)}
                        onChange={(e) => w.toggleEntry(entry, e.target.checked)}
                      />
                    </td>
                    <td className="p-2.5 font-semibold text-slate-900">
                      {entry.name ?? <span className="text-slate-400">(no name)</span>}
                      {savedQuery && <SavedQueryDetails query={savedQuery} />}
                    </td>
                    <td className="p-2.5 whitespace-nowrap">{typeLabel(entry.type)}</td>
                    <td className="p-2.5">
                      <Badge tone={match.tone}>{match.label}</Badge>
                      {match.hint && <div className="text-[10px] text-slate-400 mt-0.5">{match.hint}</div>}
                    </td>
                    <td className="p-2.5 pr-4 space-y-1">
                      {errors.map((e) => (
                        <p key={`${e.code}-${e.field}`} className="text-[11px] text-rose-700">
                          <i className="fa-solid fa-circle-xmark mr-1" />
                          <span className="font-mono">{e.field}</span>: {e.message}
                        </p>
                      ))}
                      {mapSelect(entry)}
                      {valid &&
                        entry.flags.map((f) => (
                          <p key={f} className="text-[11px] text-amber-700">
                            <i className="fa-solid fa-key mr-1" />
                            {flagLabel(f)}
                          </p>
                        ))}
                      {valid && w.mappedConnectionLabel(entry) && (
                        <p className="text-[11px] text-indigo-700">
                          <i className="fa-solid fa-link mr-1" />
                          Uses connection “{w.mappedConnectionLabel(entry)}”
                        </p>
                      )}
                      {valid && errors.length === 0 && entry.flags.length === 0 && !w.mappedConnectionLabel(entry) && <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        {w.selectedEntries.length} of {selectable} valid entr{selectable === 1 ? 'y' : 'ies'} selected. Whether an existing entry is skipped or
        replaced is decided in the next step.
      </p>
    </div>
  );
}
