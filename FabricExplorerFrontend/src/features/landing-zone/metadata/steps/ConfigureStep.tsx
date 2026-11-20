import { cn } from '@/lib/cn';
import { displayPath } from '../../utils';
import type { BaseFolder, MetadataWizardState } from '../useMetadataWizard';
import { INPUT, JsonBlock } from './shared';

export function ConfigureStep({ w }: { w: MetadataWizardState }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">1. Table &amp; Target Folder</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Schema Name</label>
              <input value={w.schemaName} onChange={(e) => w.setSchemaName(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Table Name</label>
              <input value={w.tableName} onChange={(e) => w.setTableName(e.target.value)} className={INPUT} />
            </div>
            {w.openedIn !== '' && (
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Create inside</label>
                <select value={w.baseFolder} onChange={(e) => w.setBaseFolder(e.target.value as BaseFolder)} className={INPUT}>
                  <option value="root">Landing Zone root</option>
                  <option value="current">Current folder ({displayPath(w.openedIn)})</option>
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Target Landing Zone Folder</label>
              <div className={cn('px-3 py-2 border rounded-xl font-mono text-[11px] truncate', w.targetError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-100 border-slate-200 text-slate-600')}>
                {displayPath(w.tableFolder)}
              </div>
              {w.targetError && <p className="text-rose-600 text-[11px] mt-1">{w.targetError}</p>}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Primary Key / Unique Key Columns</h4>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              {w.keyColumns.length} Key{w.keyColumns.length === 1 ? '' : 's'} Selected
            </span>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900 space-y-1">
            <p><i className="fa-solid fa-circle-info text-blue-600 mr-1" />Key columns identify a record. They are required for update and delete operations; without them the table is append-only.</p>
            <p className="font-semibold text-amber-800"><i className="fa-solid fa-lock text-amber-600 mr-1" />Once <code className="font-mono">keyColumns</code> is established in Open Mirroring it cannot be changed.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {w.keyCandidates.map((c) => {
              const checked = w.keyColumns.includes(c.name);
              return (
                <label key={c.id} className={cn('flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition-colors', checked ? 'bg-indigo-50 border-indigo-400 text-indigo-900 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50')}>
                  <input type="checkbox" checked={checked} onChange={(e) => w.toggleKey(c.name, e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                  <span className="font-mono truncate">{c.name}</span>
                </label>
              );
            })}
            {w.keyCandidates.length === 0 && <p className="col-span-full text-slate-400">No column available.</p>}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-lg flex flex-col min-h-[320px]">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2.5 mb-3 font-mono">
          <span>Live {w.fileName} Preview</span>
          {w.previewing && <i className="fa-solid fa-spinner fa-spin" />}
        </div>
        {w.previewError && <p className="text-xs text-rose-400 mb-2">{w.previewError}</p>}
        {w.preview && !w.preview.isValid ? (
          <div className="text-xs text-rose-300 space-y-1">
            <p className="font-bold">The metadata is not valid yet:</p>
            <ul className="list-disc pl-5 space-y-0.5">{w.preview.errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        ) : (
          <JsonBlock json={w.preview?.json} empty="Generating…" className="flex-1 max-h-[460px]" />
        )}
      </div>
    </div>
  );
}

