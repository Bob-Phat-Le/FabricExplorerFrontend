import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatBytes } from '../../utils';
import { SAMPLE_XSD_NAME } from '../sampleXsd';
import type { MetadataWizardState } from '../useMetadataWizard';
import { OptionField } from './shared';

export function SourceStep({ w }: { w: MetadataWizardState }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void w.analyze(file);
    if (input.current) input.current.value = '';
  };

  const record = w.analysis?.records.find((r) => r.name === w.recordName);
  const typed = w.columns.filter((c) => c.fabricType).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* 1A. format */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">1. Landing Zone Data File Format</h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose how the data files in this table are written.</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Format: {w.format.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {w.capabilities.formats.map((f) => (
              <label
                key={f.name}
                className={cn(
                  'cursor-pointer p-3.5 rounded-xl transition-all flex items-start space-x-3',
                  w.format.name === f.name ? 'border-2 border-indigo-600 bg-indigo-50/50' : 'border border-slate-200 bg-white hover:bg-slate-50',
                )}
              >
                <input type="radio" name="metadata-format" value={f.name} checked={w.format.name === f.name} onChange={() => w.setFormat(f.name)} className="hidden" />
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 bg-indigo-100 text-indigo-700">
                  <i className={cn('fa-solid', f.requiresColumnTypes ? 'fa-table-list' : 'fa-layer-group')} />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{f.title}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-snug">{f.description}</span>
                </div>
              </label>
            ))}
          </div>

          {w.format.options.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <p className="font-bold text-slate-800">{w.format.title} options</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {w.format.options.map((option) => (
                  <OptionField key={option.key} option={option} value={w.options[option.key] ?? ''} onChange={(value) => w.setOption(option.key, value)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 1B. XSD */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">2. Upload XSD Schema</h3>
              <p className="text-xs text-slate-500 mt-0.5">The XSD is analyzed on the server. Nothing is stored.</p>
            </div>
            <button type="button" onClick={() => void w.loadSample()} disabled={w.analyzing} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5">
              <i className="fa-regular fa-file-code text-indigo-500" />
              <span>Load Sample {SAMPLE_XSD_NAME}</span>
            </button>
          </div>

          {!w.analysis && (
            <div
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files);
              }}
              className={cn(
                'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors space-y-2',
                dragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50/60 hover:bg-slate-50',
              )}
            >
              <input ref={input} type="file" accept=".xsd,.xml,application/xml,text/xml" className="hidden" onChange={(e) => pick(e.target.files)} />
              {w.analyzing ? (
                <p className="text-xs text-slate-500"><i className="fa-solid fa-spinner fa-spin mr-2" />Analyzing {w.file?.name}…</p>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-lg">
                    <i className="fa-solid fa-file-arrow-up" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">Click to choose or drop an .xsd file</p>
                  <p className="text-[11px] text-slate-400">Up to 5 MB. DTD and external entities are rejected.</p>
                </>
              )}
            </div>
          )}

          {w.analyzeError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs flex items-start space-x-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">Invalid XSD{w.file ? ` (${w.file.name})` : ''}</p>
                <p className="mt-0.5 text-rose-800 break-words">{w.analyzeError}</p>
              </div>
            </div>
          )}

          {w.analysis && w.file && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0"><i className="fa-solid fa-file-code" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{w.file.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {formatBytes(w.file.size)} · Target NS: {w.analysis.targetNamespace || '(none)'} · {w.analysis.complexTypeCount} complex / {w.analysis.simpleTypeCount} simple types
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <button type="button" onClick={w.rescan} disabled={w.analyzing} className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-semibold text-slate-700">
                    <i className="fa-solid fa-rotate mr-1" />Re-scan
                  </button>
                  <button type="button" onClick={() => input.current?.click()} className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-semibold text-slate-700">Replace</button>
                  <button type="button" onClick={w.removeFile} className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg font-semibold text-rose-600">Remove</button>
                  <input ref={input} type="file" accept=".xsd,.xml,application/xml,text/xml" className="hidden" onChange={(e) => pick(e.target.files)} />
                </div>
              </div>

              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900">Record element</p>
                  <p className="text-[11px] text-slate-500">The element that becomes the table. {w.analysis.records.length} candidate{w.analysis.records.length === 1 ? '' : 's'} found.</p>
                </div>
                <select value={w.recordName} onChange={(e) => w.selectRecord(e.target.value)} className="min-w-56 px-3 py-1.5 rounded-lg border border-indigo-300 bg-white font-mono text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                  {w.analysis.records.map((r) => (
                    <option key={r.name} value={r.name}>{r.name} ({r.fields.length} fields)</option>
                  ))}
                </select>
              </div>

              {record && (
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="bg-white border border-slate-200 rounded-xl p-3">
                    <p className="text-lg font-bold text-slate-900">{w.columns.length}</p>
                    <p className="text-[11px] text-slate-500">Fields discovered</p>
                  </div>
                  {w.typed ? (
                    <>
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <p className="text-lg font-bold text-emerald-600">{typed}</p>
                        <p className="text-[11px] text-slate-500">Types auto-selected</p>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-3">
                        <p className={cn('text-lg font-bold', w.columns.length - typed > 0 ? 'text-amber-600' : 'text-slate-900')}>{w.columns.length - typed}</p>
                        <p className="text-[11px] text-slate-500">Need a type</p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 bg-white border border-slate-200 rounded-xl p-3 text-[11px] text-slate-500 flex items-center justify-center">
                      {w.format.title}: column types are read from the data files.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
