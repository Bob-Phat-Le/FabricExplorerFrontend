import { useEffect } from 'react';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import type { ConfigurationCapabilities } from '@/types/configuration';
import { useImportWizard, type WizardStep } from '../hooks/useImportWizard';
import { ConfirmStep } from './import/ConfirmStep';
import { ModeStep } from './import/ModeStep';
import { ResultsStep } from './import/ResultsStep';
import { ReviewStep } from './import/ReviewStep';
import { UploadStep } from './import/UploadStep';

const STEPS: Array<{ n: WizardStep; label: string }> = [
  { n: 1, label: 'Upload' },
  { n: 2, label: 'Review' },
  { n: 3, label: 'Mode' },
  { n: 4, label: 'Confirm' },
  { n: 5, label: 'Results' },
];

interface ImportWizardProps {
  caps: ConfigurationCapabilities;
  onClose: () => void;
  /** Called as soon as the import has run, so the inventory behind the dialog refreshes. */
  onImported: () => void;
}

export function ImportWizard({ caps, onClose, onImported }: ImportWizardProps) {
  const w = useImportWizard(caps, onImported);
  const { step, importing } = w;

  const close = () => {
    if (!importing) onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importing) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [importing, onClose]);

  return (
    <Modal maxWidth="max-w-3xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-bold">
            <i className="fa-solid fa-file-import" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Import Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Restore connections and saved queries from a JSON file</p>
          </div>
        </div>
        <ModalCloseButton onClick={close} />
      </div>

      <ol className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-medium text-slate-400">
        {STEPS.map(({ n, label }, i) => {
          const done = n < step;
          const active = n === step;
          return (
            <li key={n} className="flex items-center flex-1 last:flex-none">
              <span className={cn('flex items-center', active && 'text-indigo-600 font-bold', done && 'text-slate-700')}>
                <span
                  className={cn(
                    'w-5 h-5 rounded-full text-[10px] flex items-center justify-center mr-1.5',
                    done ? 'bg-emerald-600 text-white' : active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600',
                  )}
                >
                  {done ? <i className="fa-solid fa-check" /> : n}
                </span>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="flex-1 h-px bg-slate-200 mx-3" />}
            </li>
          );
        })}
      </ol>

      <div className="min-h-[14rem]">
        {step === 1 && <UploadStep caps={caps} checking={w.checking} fileName={w.fileName} issues={w.fileIssues} onFile={(f) => void w.loadFile(f)} />}
        {step === 2 && <ReviewStep w={w} />}
        {step === 3 && <ModeStep w={w} />}
        {step === 4 && <ConfirmStep w={w} />}
        {step === 5 && w.result && <ResultsStep result={w.result} />}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        {step > 1 && step < 5 ? (
          <button
            type="button"
            disabled={importing}
            onClick={() => w.setStep((step - 1) as WizardStep)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold disabled:opacity-60"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        <div className="flex items-center space-x-2">
          {step < 5 && (
            <button
              type="button"
              disabled={importing}
              onClick={close}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold disabled:opacity-60"
            >
              Cancel
            </button>
          )}

          {step >= 2 && step <= 3 && (
            <button
              type="button"
              disabled={!w.canAdvance}
              onClick={() => w.setStep((step + 1) as WizardStep)}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-sm"
            >
              Next step
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              disabled={!w.canAdvance}
              onClick={() => void w.execute()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-sm flex items-center space-x-2"
            >
              <i className={`fa-solid ${importing ? 'fa-spinner fa-spin' : 'fa-file-import'} text-[10px]`} />
              <span>{importing ? 'Importing…' : w.importError ? 'Retry import' : 'Execute import'}</span>
            </button>
          )}

          {step === 5 && (
            <>
              <button type="button" onClick={w.reset} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold">
                Import another file
              </button>
              <button type="button" onClick={onClose} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm">
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
