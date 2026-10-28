import { ReadyBadge, StepCard } from '@/components/ui/StepCard';
import { PrevButton } from '@/components/ui/WizardFooter';
import type { IngestionForm } from '@/types/ingestion';

interface Props {
  form: IngestionForm;
  simOutcome: string;
  setSimOutcome: (value: string) => void;
  goTo: (step: number) => void;
  onPrev: () => void;
  onSubmit: () => void;
}

function ReviewBox({ title, step, goTo, children, className = '' }: { title: string; step: number; goTo: (s: number) => void; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 ${className}`}>
      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
        <span className="font-bold text-slate-800">{title}</span>
        <button type="button" onClick={() => goTo(step)} className="text-indigo-600 hover:underline font-semibold text-[11px]">
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

const Line = ({ label, value }: { label: string; value: string }) => (
  <p className="text-slate-600">
    <span className="text-slate-400">{label}:</span> <strong className="text-slate-900">{value}</strong>
  </p>
);

export function StepReview({ form, simOutcome, setSimOutcome, goTo, onPrev, onSubmit }: Props) {
  const csvDetails =
    form.payloadFormat === 'CSV' ? `${form.csvHeader ? 'Header Included' : 'No Header'} / '${form.csvDelimiter}'` : 'N/A';
  const postLoad = form.postLoadAction === 'Archive' ? `Archive (${form.archivePath})` : form.postLoadAction;

  return (
    <StepCard
      number={5}
      total={5}
      title="Review & Trigger Ingestion"
      description="Verify configuration settings before triggering the ingestion pipeline."
      badge={<ReadyBadge>Ready to Ingest</ReadyBadge>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <ReviewBox title="1. File & Upload" step={1} goTo={goTo}>
          <Line label="File" value={form.fileName || 'None Selected'} />
          <Line label="Upload Mode" value={form.uploadMode} />
        </ReviewBox>
        <ReviewBox title="2. Payload Format" step={2} goTo={goTo}>
          <Line label="Format" value={form.payloadFormat} />
          <Line label="Header / Delimiter" value={csvDetails} />
        </ReviewBox>
        <ReviewBox title="3. Target Table" step={3} goTo={goTo}>
          <Line label="Ingest to Table" value={form.ingestToTable ? 'Enabled' : 'Disabled'} />
          <Line label="Target / Mode" value={form.ingestToTable ? `${form.targetTable} (${form.tableLoadMode})` : 'Staging Only'} />
        </ReviewBox>
        <ReviewBox title="4. Post-Load Action" step={4} goTo={goTo}>
          <Line label="Action" value={postLoad} />
        </ReviewBox>
      </div>

      {/* Simulation Mode Selector Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Pipeline Execution Mode:</span>
        <select
          value={simOutcome}
          onChange={(e) => setSimOutcome(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 outline-none"
        >
          <option value="success">Simulate Successful Run</option>
          <option value="error">Simulate Table Load Error</option>
        </select>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <PrevButton onClick={onPrev} />
        <button
          type="button"
          onClick={onSubmit}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md flex items-center space-x-2"
        >
          <i className="fa-solid fa-rocket" />
          <span>Start Ingestion Pipeline</span>
        </button>
      </div>
    </StepCard>
  );
}
