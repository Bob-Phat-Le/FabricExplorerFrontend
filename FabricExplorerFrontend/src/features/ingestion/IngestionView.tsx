'use client';

import { useState } from 'react';
import * as ingestionApi from '@/lib/api/ingestion.api';
import { Stepper } from '@/components/ui/Stepper';
import { useToast } from '@/providers/ToastProvider';
import type { IngestionForm } from '@/types/ingestion';
import { HistoryTable } from './components/HistoryTable';
import { StepFile } from './components/StepFile';
import { StepFormat } from './components/StepFormat';
import { StepPostLoad } from './components/StepPostLoad';
import { StepReview } from './components/StepReview';
import { StepTable } from './components/StepTable';
import { INITIAL_FORM, STEPS, TOTAL_STEPS } from './constants';

export function IngestionView() {
  const { showToast, showApiError } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IngestionForm>(INITIAL_FORM);
  const [simOutcome, setSimOutcome] = useState('success');

  const update = (patch: Partial<IngestionForm>) => setForm((f) => ({ ...f, ...patch }));
  const prev = () => setStep((s) => Math.max(1, s - 1));
  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));

  const selectFile = (fileName: string, fileType: string, fileSize: string) =>
    update({ hasFile: true, fileName, fileType, fileSize });

  const reset = () => {
    setForm(INITIAL_FORM);
    setSimOutcome('success');
    setStep(1);
    showToast('Ingestion wizard reset', 'info');
  };

  const submit = async () => {
    try {
      const job = await ingestionApi.submit({ ...form }, null, { simulateOutcome: simOutcome });
      showToast(`Ingestion job for ${form.fileName} completed successfully`, 'success');
      return job;
    } catch (err) {
      showApiError(err, 'Ingestion failed during table load step');
    }
  };

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ingestion Wizard</h1>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Multi-Step
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload files to Microsoft Fabric and optionally load them into a table through a guided wizard.
          </p>
        </div>
        <div className="flex items-center space-x-3">
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

      <Stepper
        steps={STEPS}
        current={step}
        onSelect={setStep}
        minWidthClass="min-w-[700px]"
        gapClass="space-x-2.5"
        lineClass="w-12"
      />

      <div className="space-y-6">
        {step === 1 && (
          <StepFile
            form={form}
            update={update}
            selectFile={selectFile}
            removeFile={() => update({ hasFile: false })}
            onNext={next}
          />
        )}
        {step === 2 && <StepFormat form={form} update={update} onPrev={prev} onNext={next} />}
        {step === 3 && <StepTable form={form} update={update} onPrev={prev} onNext={next} />}
        {step === 4 && <StepPostLoad form={form} update={update} onPrev={prev} onNext={next} />}
        {step === 5 && (
          <StepReview
            form={form}
            simOutcome={simOutcome}
            setSimOutcome={setSimOutcome}
            goTo={setStep}
            onPrev={prev}
            onSubmit={() => void submit()}
          />
        )}
      </div>

      <HistoryTable />
    </section>
  );
}
