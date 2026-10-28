'use client';

import { useState } from 'react';
import * as replicationApi from '@/lib/api/replication.api';
import { Stepper } from '@/components/ui/Stepper';
import { useToast } from '@/providers/ToastProvider';
import type { ReplicationConfig } from '@/types/replication';
import { HistoryTable } from './components/HistoryTable';
import { StepDatabase, StepMetadata, StepPayload, StepReview, StepRowMarker, StepSource } from './components/ReplSteps';
import { INITIAL_CONFIG, STEPS, TOTAL_STEPS } from './constants';

export function ReplicationView() {
  const { showToast, showApiError } = useToast();
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ReplicationConfig>(INITIAL_CONFIG);

  const update = (patch: Partial<ReplicationConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));

  const reset = () => {
    setConfig(INITIAL_CONFIG);
    setStep(1);
    showToast('Replication wizard reset', 'info');
  };

  const start = async () => {
    try {
      await replicationApi.start({ ...config });
      showToast(`Open Mirroring initialized for ${config.schema}.${config.table}`, 'success');
    } catch (err) {
      showApiError(err, 'Could not start replication');
    }
  };

  const nav = { config, update, onPrev: prev, onNext: next };

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Replication Wizard</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <i className="fa-solid fa-arrows-split-up-and-left rotate-90 mr-1 text-[9px]" />
              Open Mirroring
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Configure Open Mirroring for tables in Microsoft Fabric using a guided wizard.</p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm flex items-center space-x-1.5"
          >
            <i className="fa-solid fa-rotate-left text-slate-400" />
            <span>Reset Wizard</span>
          </button>
        </div>
      </div>

      <Stepper steps={STEPS} current={step} onSelect={setStep} minWidthClass="min-w-[780px]" gapClass="space-x-2" lineClass="w-8" />

      <div className="space-y-6">
        {step === 1 && <StepDatabase {...nav} />}
        {step === 2 && <StepSource {...nav} />}
        {step === 3 && <StepMetadata {...nav} />}
        {step === 4 && <StepPayload {...nav} />}
        {step === 5 && <StepRowMarker {...nav} />}
        {step === 6 && <StepReview config={config} goTo={setStep} onPrev={prev} onStart={() => void start()} />}
      </div>

      <HistoryTable />
    </section>
  );
}
