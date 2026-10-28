import { RadioCard } from '@/components/ui/RadioCard';
import { StepCard } from '@/components/ui/StepCard';
import { NextButton, WizardFooter } from '@/components/ui/WizardFooter';
import { useToast } from '@/providers/ToastProvider';
import type { IngestionForm, PostLoadAction } from '@/types/ingestion';

interface Props {
  form: IngestionForm;
  update: (patch: Partial<IngestionForm>) => void;
  onPrev: () => void;
  onNext: () => void;
}

const ACTIONS: { action: PostLoadAction; title: string; description: string }[] = [
  { action: 'Archive', title: 'Archive to Folder', description: 'Move file to designated archive directory.' },
  { action: 'Retain', title: 'Retain', description: 'Keep staged file in landing area.' },
  { action: 'Delete', title: 'Delete Staged File', description: 'Permanently purge staged file post-load.' },
];

export function StepPostLoad({ form, update, onPrev, onNext }: Props) {
  const { showToast } = useToast();

  return (
    <StepCard
      number={4}
      total={5}
      title="Post-Load File Disposition"
      description="Decide what happens to the staged file after pipeline execution."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ACTIONS.map((a) => (
          <RadioCard
            key={a.action}
            name="postLoadAction"
            value={a.action}
            selected={form.postLoadAction === a.action}
            onSelect={() => update({ postLoadAction: a.action })}
            title={a.title}
            description={a.description}
          />
        ))}
      </div>

      {form.postLoadAction === 'Archive' && (
        <div className="pt-2">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Archive Folder Path</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={form.archivePath}
              onChange={(e) => update({ archivePath: e.target.value })}
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="button"
              onClick={() => showToast('Folder path browser', 'info')}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700"
            >
              Browse
            </button>
          </div>
        </div>
      )}

      {form.postLoadAction === 'Delete' && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center space-x-2">
          <i className="fa-solid fa-trash-can text-rose-600 text-sm" />
          <span>Warning: The staged file will be permanently deleted after successful table load (Preserved if load fails).</span>
        </div>
      )}

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Review & Ingest</NextButton>
      </WizardFooter>
    </StepCard>
  );
}
