import type { ComponentType } from 'react';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { Stepper } from '@/components/ui/Stepper';
import type { LandingZoneItem, MetadataCapabilities } from '@/types/landingZone';
import type { LandingZoneState } from '../hooks/useLandingZone';
import { METADATA_STEPS, STEP, type StepId } from './constants';
import { ConfigureStep } from './steps/ConfigureStep';
import { PreviewStep } from './steps/PreviewStep';
import { PublishStep } from './steps/PublishStep';
import { SourceStep } from './steps/SourceStep';
import { TypesStep } from './steps/TypesStep';
import { useMetadataCapabilities } from './useMetadataCapabilities';
import { useMetadataWizard, type MetadataWizardState } from './useMetadataWizard';

interface Props {
  state: LandingZoneState;
  onClose: () => void;
  onViewFile: (item: LandingZoneItem) => void;
}

const STEP_VIEWS: Record<Exclude<StepId, typeof STEP.publish>, ComponentType<{ w: MetadataWizardState }>> = {
  [STEP.source]: SourceStep,
  [STEP.types]: TypesStep,
  [STEP.configure]: ConfigureStep,
  [STEP.preview]: PreviewStep,
};

/** Loads what the backend supports, then hands over to the wizard. */
export function MetadataWizard(props: Props) {
  const { capabilities, error } = useMetadataCapabilities();

  if (capabilities) return <WizardBody {...props} capabilities={capabilities} />;

  return (
    <Modal maxWidth="max-w-md">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-900">Generate Metadata</h3>
        <ModalCloseButton onClick={props.onClose} />
      </div>
      {error ? (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3.5">{error}</p>
      ) : (
        <p className="text-xs text-slate-500 py-6 text-center"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading metadata formats…</p>
      )}
    </Modal>
  );
}

function WizardBody({ state, onClose, onViewFile, capabilities }: Props & { capabilities: MetadataCapabilities }) {
  const w = useMetadataWizard(state, capabilities);
  const done = w.published !== null;
  const steps = METADATA_STEPS.filter((s) => s.appliesTo(w.format));
  const position = steps.findIndex((s) => s.id === w.step) + 1;
  const nextLabel = steps[position - 1].nextLabel;
  const StepView = w.step === STEP.publish ? null : STEP_VIEWS[w.step];

  return (
    <Modal maxWidth="max-w-6xl">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-indigo-300 flex items-center justify-center"><i className="fa-solid fa-wand-magic-sparkles" /></div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Generate Metadata</h3>
            <p className="text-xs text-slate-500">Create the Open Mirroring <code className="font-mono">{w.fileName}</code> from an XSD schema.</p>
          </div>
        </div>
        <ModalCloseButton onClick={onClose} />
      </div>

      <Stepper steps={steps} current={position} onSelect={(n) => w.goTo(steps[n - 1].id)} minWidthClass="min-w-[680px]" gapClass="space-x-2.5" lineClass="flex-1 mx-3" />

      <div className="min-h-[360px]">
        {StepView ? <StepView w={w} /> : <PublishStep w={w} onViewFile={onViewFile} onOpenFolder={state.navigate} onClose={onClose} />}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={w.back}
          disabled={w.step === STEP.source || done}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-2"
        >
          <i className="fa-solid fa-arrow-left text-[11px]" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold">{done ? 'Close' : 'Cancel'}</button>
          {w.step !== STEP.publish && (
            <button
              type="button"
              onClick={w.next}
              disabled={!w.analysis || w.analyzing}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center space-x-2"
            >
              <span>{nextLabel}</span>
              <i className="fa-solid fa-arrow-right text-[11px]" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
