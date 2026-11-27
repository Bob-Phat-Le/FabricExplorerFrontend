import { useEffect, useRef, useState } from 'react';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { RadioCard } from '@/components/ui/RadioCard';
import { Toggle } from '@/components/ui/Toggle';
import { SettingRow } from '@/components/ui/WizardFooter';
import * as configurationApi from '@/lib/api/configuration.api';
import { useToast } from '@/providers/ToastProvider';
import type { ExportItemRef, ExportScope } from '@/types/configuration';
import { previewFileName, saveBlob } from '../utils';

interface ExportModalProps {
  initialScope: ExportScope;
  selected: ReadonlyMap<string, ExportItemRef>;
  totalItems: number;
  onClose: () => void;
}

export function ExportModal({ initialScope, selected, totalItems, onClose }: ExportModalProps) {
  const { showToast, showApiError } = useToast();
  const selectedCount = selected.size;

  const [scope, setScope] = useState<ExportScope>(initialScope === 'selected' && selectedCount > 0 ? 'selected' : 'all');
  const [landingZone, setLandingZone] = useState(false);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const run = async () => {
    abort.current = new AbortController();
    setBusy(true);
    try {
      const result = await configurationApi.exportConfiguration(
        {
          scope,
          items: scope === 'selected' ? [...selected.values()] : undefined,
          include: { landingZone },
        },
        { signal: abort.current.signal },
      );
      saveBlob(result.blob, result.fileName);

      const count = result.exported === null ? '' : ` ${result.exported} item(s)`;
      showToast(`Exported${count} to ${result.fileName}. Credentials excluded.`, 'success');
      if (result.skipped > 0)
        showToast(`${result.skipped} saved query(ies) were left out because their connection no longer exists.`, 'warning');
      onClose();
    } catch (err) {
      showApiError(err, 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal maxWidth="max-w-xl">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-bold">
            <i className="fa-solid fa-file-export" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Export Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Back up your connections and saved queries to JSON</p>
          </div>
        </div>
        <ModalCloseButton onClick={busy ? () => undefined : onClose} />
      </div>

      <div className="space-y-3 text-xs">
        <p className="font-bold text-slate-800">Export scope</p>
        <div className="grid grid-cols-2 gap-3">
          <RadioCard
            name="exportScope"
            value="all"
            selected={scope === 'all'}
            onSelect={() => setScope('all')}
            title="Export all"
            description={`Every connection and saved query (${totalItems} in total).`}
          />
          <div className={selectedCount === 0 ? 'opacity-50 pointer-events-none' : undefined}>
            <RadioCard
              name="exportScope"
              value="selected"
              selected={scope === 'selected'}
              onSelect={() => setScope('selected')}
              title="Export selected"
              description={`${selectedCount} item${selectedCount === 1 ? '' : 's'} selected in the table.`}
            />
          </div>
        </div>
        {scope === 'selected' && (
          <p className="text-[11px] text-slate-500">
            Connections referenced by the selected saved queries are added automatically so the file can be imported on its own.
          </p>
        )}

        <SettingRow title="Include Landing Zone configuration" description="Adds the Landing Zone URI of each exported connection (when it has one).">
          <Toggle checked={landingZone} onChange={setLandingZone} />
        </SettingRow>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 space-y-1.5">
          <div className="flex items-center space-x-2 font-bold text-amber-900">
            <i className="fa-solid fa-shield-halved text-amber-600" />
            <span>Before you share the file</span>
          </div>
          <ul className="text-[11px] leading-relaxed list-disc pl-5 space-y-0.5">
            <li>Client secrets and tokens are never exported. Re-enter the secret after importing a connection.</li>
            <li>Saved query SQL is exported as written. Check it for literals you do not want to share.</li>
          </ul>
        </div>

        <p className="text-[11px] text-slate-400">
          File name: <span className="font-mono text-slate-500">{previewFileName()}</span>
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || (scope === 'selected' && selectedCount === 0)}
          onClick={run}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
        >
          <i className={`fa-solid ${busy ? 'fa-spinner fa-spin' : 'fa-download'} text-[10px]`} />
          <span>{busy ? 'Exporting…' : 'Export JSON'}</span>
        </button>
      </div>
    </Modal>
  );
}
