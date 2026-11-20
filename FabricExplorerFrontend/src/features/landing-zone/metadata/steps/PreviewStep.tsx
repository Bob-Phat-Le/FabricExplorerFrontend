import { displayPath } from '../../utils';
import type { MetadataWizardState } from '../useMetadataWizard';
import { ErrorList, JsonBlock } from './shared';

export function PreviewStep({ w }: { w: MetadataWizardState }) {
  const valid = !!w.preview?.isValid;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        {w.previewing ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><i className="fa-solid fa-spinner fa-spin mr-1.5" />Validating…</span>
        ) : valid ? (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><i className="fa-solid fa-circle-check mr-1.5" />All Open Mirroring checks passed</span>
        ) : (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><i className="fa-solid fa-circle-xmark mr-1.5" />Validation failed</span>
        )}
        <div className="flex items-center space-x-2">
          <button type="button" disabled={!valid} onClick={w.copyJson} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5">
            <i className="fa-regular fa-copy" /><span>Copy JSON</span>
          </button>
          <button type="button" disabled={!valid} onClick={w.downloadJson} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5">
            <i className="fa-solid fa-download" /><span>Download JSON</span>
          </button>
          <button type="button" onClick={() => { if (window.confirm('Reset the whole configuration?')) w.reset(); }} className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-xl">Reset</button>
        </div>
      </div>

      {w.previewError && <ErrorList title="Could not generate the preview" errors={[w.previewError]} />}
      {w.preview && !w.preview.isValid && <ErrorList title="Fix these problems before uploading" errors={w.preview.errors} />}

      <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2.5 mb-3 font-mono">
          <span>{w.fileName}</span>
          <span className="truncate ml-4">Target: {displayPath(w.filePath)}</span>
        </div>
        <JsonBlock json={w.preview?.json} empty={w.previewing ? 'Generating…' : 'No JSON: the metadata is not valid.'} className="max-h-[380px]" />
      </div>
    </div>
  );
}
