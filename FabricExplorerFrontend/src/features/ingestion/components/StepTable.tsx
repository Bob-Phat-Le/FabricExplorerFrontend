import { RadioCard } from '@/components/ui/RadioCard';
import { StepCard } from '@/components/ui/StepCard';
import { Toggle } from '@/components/ui/Toggle';
import { NextButton, WizardFooter, SettingRow } from '@/components/ui/WizardFooter';
import type { IngestionForm } from '@/types/ingestion';

interface Props {
  form: IngestionForm;
  update: (patch: Partial<IngestionForm>) => void;
  onPrev: () => void;
  onNext: () => void;
}

export function StepTable({ form, update, onPrev, onNext }: Props) {
  return (
    <StepCard number={3} total={5} title="Target Table Load" description="Configure target Delta table ingestion settings.">
      <SettingRow title="Ingest to Table After Uploading" description="Automatically load staged file into a Lakehouse table.">
        <Toggle checked={form.ingestToTable} onChange={(ingestToTable) => update({ ingestToTable })} />
      </SettingRow>

      {!form.ingestToTable ? (
        <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
          <i className="fa-solid fa-info-circle mr-1 text-indigo-500" /> The file will only be uploaded and staged in Lakehouse
          storage without loading into a database table.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Table Name</label>
            <div className="relative max-w-md">
              <input
                type="text"
                value={form.targetTable}
                onChange={(e) => update({ targetTable: e.target.value })}
                placeholder="Enter or search table name..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <div className="absolute right-2 top-1.5 space-x-1">
                {['Customers', 'Orders'].map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => update({ targetTable: name })}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded text-slate-600"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Table Load Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <RadioCard
                name="tableLoadMode"
                value="Append"
                selected={form.tableLoadMode === 'Append'}
                onSelect={() => update({ tableLoadMode: 'Append' })}
                title="Append Records"
                description="Append rows to existing table."
              />
              <RadioCard
                name="tableLoadMode"
                value="Overwrite"
                selected={form.tableLoadMode === 'Overwrite'}
                onSelect={() => update({ tableLoadMode: 'Overwrite' })}
                title="Overwrite Table"
                description="Truncate and replace table records."
              />
            </div>
            {form.tableLoadMode === 'Overwrite' && (
              <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
                <i className="fa-solid fa-triangle-exclamation text-rose-600 text-sm" />
                <span>Caution: Existing table data will be permanently overwritten.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Post-Load Action</NextButton>
      </WizardFooter>
    </StepCard>
  );
}
