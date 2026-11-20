import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { MetadataWizardState } from '../useMetadataWizard';

export function TypesStep({ w }: { w: MetadataWizardState }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? w.columns.filter((c) => [c.name, c.xsdType, c.fabricType].some((v) => v.toLowerCase().includes(q))) : w.columns;
  }, [w.columns, search]);

  const includedCount = w.columns.filter((c) => c.included).length;
  const allIncluded = w.columns.length > 0 && includedCount === w.columns.length;

  return (
    <div className="space-y-4">
      {w.unresolved.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2.5">
          <i className="fa-solid fa-triangle-exclamation text-amber-600 mt-0.5" />
          <p>
            <strong>{w.unresolved.length} included field(s)</strong> have no Fabric data type (nested, repeating or unsupported XSD types). Choose a type or exclude them to continue.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search fields or types…" className="w-64 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded text-[11px]">{includedCount} of {w.columns.length} included</span>
          </div>
          <button type="button" onClick={w.resetTypes} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl font-semibold text-slate-700">
            <i className="fa-solid fa-rotate-left mr-1.5 text-slate-400" />Reset to recommended
          </button>
        </div>

        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] sticky top-0 z-10">
              <tr>
                <th className="p-2.5 pl-4">Field</th>
                <th className="p-2.5">XSD type</th>
                <th className="p-2.5">Fabric data type</th>
                <th className="p-2.5">Nullable</th>
                <th className="p-2.5 pr-4 text-center">
                  <label className="inline-flex items-center space-x-1.5 cursor-pointer">
                    <input type="checkbox" checked={allIncluded} onChange={(e) => w.toggleIncludeAll(e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                    <span>Include</span>
                  </label>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">No fields match &quot;{search}&quot;.</td>
                </tr>
              )}
              {rows.map((c) => {
                const missing = c.included && !c.fabricType;
                const changed = c.fabricType !== c.recommendedType;
                return (
                  <tr key={c.id} className={cn(!c.included && 'opacity-60', missing ? 'bg-amber-50/60' : 'hover:bg-slate-50')}>
                    <td className="p-2.5 pl-4 font-mono font-bold text-slate-900">
                      <span className="mr-1.5">{c.name}</span>
                      {c.isNested && <span className="px-1.5 rounded bg-amber-100 text-amber-800 text-[9px] font-sans">Nested</span>}
                      {c.isRepeating && <span className="px-1.5 rounded bg-amber-100 text-amber-800 text-[9px] font-sans ml-1">Repeating</span>}
                      {c.isAttribute && <span className="px-1.5 rounded bg-slate-100 text-slate-600 text-[9px] font-sans ml-1">Attribute</span>}
                    </td>
                    <td className="p-2.5 font-mono text-slate-600">{c.xsdType}</td>
                    <td className="p-2.5">
                      <select
                        value={c.fabricType}
                        onChange={(e) => w.setFabricType(c.id, e.target.value)}
                        className={cn(
                          'w-44 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none',
                          !c.fabricType ? 'border-amber-400 bg-amber-50 text-amber-900' : changed ? 'border-indigo-400 bg-indigo-50 text-indigo-950' : 'border-slate-300 bg-white text-slate-900',
                        )}
                      >
                        <option value="">Select type ▼</option>
                        {w.capabilities.fabricTypes.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td className={cn('p-2.5 font-semibold', c.nullable ? 'text-slate-600' : 'text-indigo-700')}>{c.nullable ? 'Yes' : 'No'}</td>
                    <td className="p-2.5 pr-4 text-center">
                      <input type="checkbox" checked={c.included} onChange={(e) => w.toggleInclude(c.id, e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
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
