import { useEffect, useState } from 'react';
import * as lzApi from '@/lib/api/landingZone.api';
import { ApiError } from '@/lib/api/client';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useClipboard } from '@/hooks/useClipboard';
import type { LandingZoneFileDetails, LandingZoneItem, LandingZonePreview } from '@/types/landingZone';
import { displayPath, formatBytes, iconOf } from '../utils';

interface Props {
  item: LandingZoneItem;
  connectionId: string;
  onClose: () => void;
  onDownload: (item: LandingZoneItem) => void;
  onRename: (item: LandingZoneItem) => void;
  onMove: (item: LandingZoneItem) => void;
  onDelete: (item: LandingZoneItem) => void;
}

const msg = (err: unknown) => (err instanceof ApiError || err instanceof Error ? err.message : 'Request failed');

function Meta({ label, value, mono = true, wide = false }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={cn(wide && 'col-span-2 pt-1 border-t border-slate-200/70')}>
      <span className="text-slate-400 text-[10px] block">{label}</span>
      <span className={cn('text-slate-800 break-all', mono ? 'font-mono text-[11px]' : 'font-medium')}>{value}</span>
    </div>
  );
}

export function FileDrawer({ item, connectionId, onClose, onDownload, onRename, onMove, onDelete }: Props) {
  const copy = useClipboard();
  const [details, setDetails] = useState<LandingZoneFileDetails | null>(null);
  const [preview, setPreview] = useState<LandingZonePreview | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setDetails(null);
    setPreview(null);
    setDetailsError(null);
    setPreviewError(null);

    Promise.all([
      lzApi.getFileDetails(connectionId, item.path, { signal: ctrl.signal }).then(setDetails, (e) => !ctrl.signal.aborted && setDetailsError(msg(e))),
      lzApi.getPreview(connectionId, item.path, { signal: ctrl.signal }).then(setPreview, (e) => !ctrl.signal.aborted && setPreviewError(msg(e))),
    ]).finally(() => {
      if (!ctrl.signal.aborted) setLoading(false);
    });

    return () => ctrl.abort();
  }, [connectionId, item.path]);

  const icon = iconOf(item);
  const copyable = preview && (preview.kind === 'json' || preview.kind === 'text') ? preview.text : null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', icon.bg, icon.color)}>
              <i className={icon.icon} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">{item.name}</h3>
              <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{displayPath(item.path)}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors">
            <i className="fa-solid fa-xmark text-base" />
          </button>
        </div>

        <div className="px-6 py-2.5 border-b border-slate-100 flex items-center flex-wrap gap-2 text-xs shrink-0">
          <button type="button" onClick={() => onDownload(item)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg flex items-center space-x-1.5">
            <i className="fa-solid fa-download text-[11px]" />
            <span>Download</span>
          </button>
          <button type="button" onClick={() => onRename(item)} className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center space-x-1">
            <i className="fa-solid fa-pen text-[10px] text-slate-400" />
            <span>Rename</span>
          </button>
          <button type="button" onClick={() => onMove(item)} className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg flex items-center space-x-1">
            <i className="fa-solid fa-arrow-right-to-bracket text-[10px] text-slate-400" />
            <span>Move</span>
          </button>
          <button type="button" onClick={() => onDelete(item)} className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-lg flex items-center space-x-1 ml-auto">
            <i className="fa-regular fa-trash-can text-[10px]" />
            <span>Delete</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">File Information & Metadata</h4>
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Meta label="File Extension" value={item.extension ? `.${item.extension}` : '—'} />
              <Meta label="File Size" value={formatBytes(details?.sizeBytes ?? item.sizeBytes)} />
              <Meta label="Content Type" value={details?.contentType ?? '—'} />
              <Meta label="Owner" value={item.owner ?? '—'} mono={false} />
              <Meta label="Created Timestamp" value={formatDateTime(details?.createdAt)} />
              <Meta label="Last Modified" value={formatDateTime(details?.lastModified ?? item.lastModified)} />
              <Meta label="Storage Location" value={details?.storageUri ?? '—'} wide />
            </div>
            {detailsError && <p className="text-[11px] text-rose-600">{detailsError}</p>}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partial File Preview</h4>
              {copyable && (
                <button type="button" onClick={() => void copy(copyable, 'Copied preview content')} className="text-indigo-600 font-bold hover:underline flex items-center space-x-1 text-[11px]">
                  <i className="fa-regular fa-copy" />
                  <span>Copy Content</span>
                </button>
              )}
            </div>

            {loading && !preview && (
              <div className="p-6 text-center text-slate-400">
                <i className="fa-solid fa-spinner fa-spin mr-2" />
                Loading preview…
              </div>
            )}

            {previewError && <p className="text-[11px] text-rose-600">{previewError}</p>}

            {preview?.kind === 'csv' && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Sample Rows (first {preview.rows?.length ?? 0} records){preview.truncated ? ' · more rows in file' : ''}</span>
                  <span className="font-mono text-indigo-600 font-semibold">
                    {preview.delimiter === '\t' ? 'Tab' : preview.delimiter === ',' ? 'Comma' : `“${preview.delimiter}”`} Delimited
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-mono border-b border-slate-200">
                      <tr>{(preview.headers ?? []).map((h, i) => <th key={i} className="p-2">{h}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {(preview.rows ?? []).map((row, r) => (
                        <tr key={r}>{row.map((c, i) => <td key={i} className="p-2">{c}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {preview?.kind === 'json' && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
                <pre>{preview.text}</pre>
                {preview.truncated && <p className="text-slate-500 mt-2">… preview truncated</p>}
              </div>
            )}

            {preview?.kind === 'text' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed break-all">
                {preview.text}
                {preview.truncated && <p className="text-slate-400 mt-2">… preview truncated</p>}
              </div>
            )}

            {preview?.kind === 'unsupported' && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center mx-auto">
                  <i className="fa-regular fa-eye-slash" />
                </div>
                <p className="text-xs font-bold text-slate-700">Preview is not available for this file type.</p>
                <button type="button" onClick={() => onDownload(item)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs inline-flex items-center space-x-1.5">
                  <i className="fa-solid fa-download" />
                  <span>Download File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
