import type { ReactNode } from 'react';
import type { LandingZoneItem } from '@/types/landingZone';
import { displayPath } from '../../utils';
import type { MetadataWizardState } from '../useMetadataWizard';
import { JsonBlock } from './shared';

interface Props {
  w: MetadataWizardState;
  onViewFile: (item: LandingZoneItem) => void;
  onOpenFolder: (path: string) => void;
  onClose: () => void;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-mono font-bold text-slate-800 text-right break-all">{children}</span>
    </div>
  );
}

export function PublishStep({ w, onViewFile, onOpenFolder, onClose }: Props) {
  if (w.published && w.publishedItem) {
    const item = w.publishedItem;
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-emerald-200 p-7 shadow-sm text-center space-y-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <i className="fa-solid fa-circle-check mr-1.5" />{w.published.overwritten ? 'Replaced successfully' : 'Uploaded successfully'}
        </span>
        <h3 className="text-base font-bold text-slate-900">{w.fileName} is in the Landing Zone</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          <code className="font-mono text-indigo-700 font-semibold break-all">{displayPath(w.published.filePath)}</code>
        </p>
        <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs">
          <button type="button" onClick={() => { onClose(); onViewFile(item); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1.5">
            <i className="fa-regular fa-eye" /><span>View File</span>
          </button>
          <button type="button" onClick={w.downloadJson} className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5">
            <i className="fa-solid fa-download" /><span>Download</span>
          </button>
          <button type="button" onClick={() => { onClose(); onOpenFolder(w.tableFolder); }} className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5">
            <i className="fa-regular fa-folder-open text-amber-500" /><span>Open Folder</span>
          </button>
          <button type="button" onClick={w.reset} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl">Generate Another</button>
        </div>
      </div>
    );
  }

  const exists = w.existing === 'yes';
  const keys = w.keyColumns.length > 0 ? w.keyColumns.join(', ') : '(none, append only)';
  const included = w.columns.filter((c) => c.included).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg"><i className="fa-solid fa-cloud-arrow-up" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload {w.fileName}</h3>
            <p className="text-xs text-slate-500">Review the target before writing to the Landing Zone.</p>
          </div>
        </div>

        <div className="text-xs divide-y divide-slate-100 border border-slate-200 rounded-xl px-4 py-1.5 bg-slate-50/50">
          <Row label="Target file">{displayPath(w.filePath)}</Row>
          <Row label="Table">{w.tableName.trim()}</Row>
          <Row label="File format">{w.format.title}</Row>
          <Row label="Columns">{w.typed ? `${included} typed column(s)` : `Omitted (${w.format.title} is self-describing)`}</Row>
          <Row label="Key columns">{keys}</Row>
        </div>

        {w.existing === 'checking' && <p className="text-xs text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2" />Checking the target folder…</p>}

        {exists && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-900 space-y-2">
            <p className="font-bold"><i className="fa-solid fa-triangle-exclamation text-amber-600 mr-1.5" />A {w.fileName} already exists in this folder</p>
            <p className="text-[11px]">Uploading will replace it. Open Mirroring does not allow key columns to change once they are established.</p>
            <div className="flex items-center space-x-2">
              <button type="button" onClick={() => void w.inspectExisting()} className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg font-semibold">Inspect existing</button>
            </div>
            {w.existingText !== null && <JsonBlock json={w.existingText} empty="" className="bg-slate-950 rounded-lg p-3 max-h-48" />}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
          <button type="button" onClick={w.downloadJson} disabled={!w.canPublish} className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-semibold rounded-xl flex items-center space-x-1.5">
            <i className="fa-solid fa-download" /><span>Download only</span>
          </button>
          <button
            type="button"
            disabled={!w.canPublish || w.publishing || w.existing === 'checking'}
            onClick={() => void w.publish(exists)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center space-x-2"
          >
            <i className={w.publishing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-cloud-arrow-up'} />
            <span>{exists ? `Replace existing ${w.fileName}` : `Upload ${w.fileName}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
