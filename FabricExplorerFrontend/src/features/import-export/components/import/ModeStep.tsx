import { RadioCard } from '@/components/ui/RadioCard';
import { Toggle } from '@/components/ui/Toggle';
import { SettingRow } from '@/components/ui/WizardFooter';
import type { ImportWizardState } from '../../hooks/useImportWizard';

export function ModeStep({ w }: { w: ImportWizardState }) {
  const overwriting = w.mode === 'overwrite';
  const replaced = w.plan.filter((p) => p.action === 'update');
  const resets = w.needCredentials.filter((p) => p.action === 'update');

  return (
    <div className="space-y-4 text-xs">
      <h4 className="font-bold text-slate-900 uppercase tracking-wider">When an entry already exists</h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RadioCard
          name="importMode"
          value="merge"
          selected={w.mode === 'merge'}
          onSelect={() => w.setMode('merge')}
          title="Merge (default)"
          description="Add new entries and leave existing ones untouched. Existing connections keep their settings and queries keep their SQL."
        />
        <RadioCard
          name="importMode"
          value="overwrite"
          selected={overwriting}
          onSelect={() => w.setMode('overwrite')}
          title="Overwrite"
          description="Existing entries take the content of the file. New entries are still added."
        />
      </div>

      {overwriting && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 space-y-1.5">
          <div className="flex items-center space-x-2 font-bold">
            <i className="fa-solid fa-triangle-exclamation text-amber-600" />
            <span>
              {replaced.length} existing entr{replaced.length === 1 ? 'y' : 'ies'} will be replaced
            </span>
          </div>
          <ul className="text-[11px] leading-relaxed list-disc pl-5 space-y-0.5">
            <li>Names, SQL and connection settings come from the file. Creation date and id are kept.</li>
            <li>Stored client secrets are kept, unless the file changes the client id or tenant of a connection.</li>
            {resets.length > 0 && (
              <li className="font-semibold">
                {resets.length} connection{resets.length === 1 ? '' : 's'} will lose the stored secret: {resets.map((r) => r.entry.name).join(', ')}.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="font-bold text-slate-900 uppercase tracking-wider pt-1">Options</h4>

        {w.hasLandingZone && (
          <SettingRow title="Restore Landing Zone configuration" description="Applies the Landing Zone URI found in the file to the imported connections.">
            <Toggle checked={w.restoreLandingZone} onChange={(v) => w.setOption('restoreLandingZone', v)} />
          </SettingRow>
        )}

        <SettingRow title="All or nothing" description="If a single entry fails, nothing is imported. Off: each entry is imported on its own.">
          <Toggle checked={w.atomic} onChange={(v) => w.setOption('atomic', v)} />
        </SettingRow>
      </div>

      <p className="text-[11px] text-slate-500">
        The active connection is never changed by an import.
      </p>
    </div>
  );
}
