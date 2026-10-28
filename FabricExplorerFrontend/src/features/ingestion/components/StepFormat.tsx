import { cn } from '@/lib/cn';
import { StepCard } from '@/components/ui/StepCard';
import { Toggle } from '@/components/ui/Toggle';
import { NextButton, WizardFooter } from '@/components/ui/WizardFooter';
import type { IngestionForm, PayloadFormat } from '@/types/ingestion';

interface Props {
  form: IngestionForm;
  update: (patch: Partial<IngestionForm>) => void;
  onPrev: () => void;
  onNext: () => void;
}

const FORMAT_BASE = 'py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2';
const FORMAT_ON = `${FORMAT_BASE} border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700`;
const FORMAT_OFF = `${FORMAT_BASE} border border-slate-200 bg-white text-slate-700 hover:border-indigo-300`;

const FORMATS: { value: PayloadFormat; icon: string; description: string }[] = [
  { value: 'CSV', icon: 'fa-file-csv', description: 'Comma-separated text file format with customizable delimiters.' },
  { value: 'Parquet', icon: 'fa-box', description: 'Columnar storage format optimized for high-performance analytical queries.' },
];

const DELIMITERS: { label: string; char: string }[] = [
  { label: 'Comma ( , )', char: ',' },
  { label: 'Semicolon ( ; )', char: ';' },
  { label: 'Pipe ( | )', char: '|' },
  { label: 'Tab ( \\t )', char: '\t' },
];

export function StepFormat({ form, update, onPrev, onNext }: Props) {
  const current = FORMATS.find((f) => f.value === form.payloadFormat) ?? FORMATS[0];

  return (
    <StepCard
      number={2}
      total={5}
      title="Payload Format & Settings"
      description="Select payload format and configure parser parameters."
    >
      <div className="space-y-4">
        <label className="block text-xs font-semibold text-slate-800">Payload Format</label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => update({ payloadFormat: f.value })}
              className={form.payloadFormat === f.value ? FORMAT_ON : FORMAT_OFF}
            >
              <i className={cn('fa-solid text-base', f.icon)} />
              <span>{f.value}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">{current.description}</p>
      </div>

      {/* CSV Dynamic Options */}
      {form.payloadFormat === 'CSV' && (
        <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-4 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">CSV Options</h3>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-800">Has Header Row</p>
              <p className="text-[11px] text-slate-400">First row contains column headers.</p>
            </div>
            <Toggle size="sm" checked={form.csvHeader} onChange={(csvHeader) => update({ csvHeader })} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Delimiter Character</label>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={form.csvDelimiter}
                maxLength={5}
                onChange={(e) => update({ csvDelimiter: e.target.value })}
                className="w-20 text-center font-mono text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                {DELIMITERS.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => update({ csvDelimiter: d.char })}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Target Table</NextButton>
      </WizardFooter>
    </StepCard>
  );
}
