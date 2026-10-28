import { RadioCard } from '@/components/ui/RadioCard';
import { StepCard } from '@/components/ui/StepCard';
import { NextButton, WizardFooter } from '@/components/ui/WizardFooter';
import type { IngestionForm, UploadMode } from '@/types/ingestion';

interface Props {
  form: IngestionForm;
  update: (patch: Partial<IngestionForm>) => void;
  selectFile: (name: string, type: string, size: string) => void;
  removeFile: () => void;
  onNext: () => void;
}

const MODES: { mode: UploadMode; title: string; description: string }[] = [
  { mode: 'Overwrite', title: 'Overwrite', description: 'Replace existing file if name matches.' },
  { mode: 'Append', title: 'Append', description: 'Add content to existing staged file.' },
  { mode: 'Create New', title: 'Create New File', description: 'Keep existing and create unique file.' },
];

export function StepFile({ form, update, selectFile, removeFile, onNext }: Props) {
  return (
    <StepCard
      number={1}
      total={5}
      title="File & Upload Mode"
      description="Select or drag-and-drop a file to stage and choose upload behavior."
    >
      {/* TODO(api): chọn file giả lập; cần <input type="file"> thật để ingestion.submit nhận được file. */}
      {!form.hasFile ? (
        <div
          onClick={() => selectFile('customers.csv', 'CSV', '24.8 MB')}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-400 transition-all cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-cloud-arrow-up text-xl" />
          </div>
          <p className="text-xs font-semibold text-slate-700">Drag & drop your file here</p>
          <p className="text-[11px] text-slate-400 mt-1">or click to browse local files (CSV, Parquet supported)</p>
          <button
            type="button"
            className="mt-4 px-3.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            Browse Files
          </button>
        </div>
      ) : (
        <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                <i className="fa-solid fa-file-csv" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{form.fileName}</span>
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded">{form.fileType}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{form.fileSize}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => selectFile('sales_2026.parquet', 'Parquet', '112.4 MB')}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Replace File
              </button>
              <button
                type="button"
                onClick={removeFile}
                className="px-2.5 py-1 bg-white border border-rose-200 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-indigo-100/60">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Staged File Name</label>
            <input
              type="text"
              value={form.fileName}
              onChange={(e) => update({ fileName: e.target.value })}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <label className="block text-xs font-semibold text-slate-800">Upload Mode</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map((m) => (
            <RadioCard
              key={m.mode}
              name="uploadMode"
              value={m.mode}
              selected={form.uploadMode === m.mode}
              onSelect={() => update({ uploadMode: m.mode })}
              title={m.title}
              description={m.description}
            />
          ))}
        </div>
        {form.uploadMode === 'Overwrite' && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center space-x-2 mt-2">
            <i className="fa-solid fa-triangle-exclamation text-amber-600 text-sm" />
            <span>Warning: An existing file with the same name in the staging folder may be replaced.</span>
          </div>
        )}
      </div>

      <WizardFooter>
        <NextButton onClick={onNext} disabled={!form.hasFile}>
          Next: Format Settings
        </NextButton>
      </WizardFooter>
    </StepCard>
  );
}
