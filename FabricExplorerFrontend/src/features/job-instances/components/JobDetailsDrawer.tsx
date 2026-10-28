import { Drawer } from '@/components/ui/Drawer';
import { useClipboard } from '@/hooks/useClipboard';
import type { JobInstance } from '@/types/fabric';
import { formatDuration } from '../utils';
import { JobStatusBadge } from './JobStatusBadge';

export function JobDetailsDrawer({ job, onClose }: { job: JobInstance; onClose: () => void }) {
  const copy = useClipboard();
  const errorText = job.errorMsg || 'Pipeline execution failed.';

  const idRow = (label: string, value: string, toast: string, hint?: string) => (
    <div>
      <span className="text-slate-400 block font-sans">{label}</span>
      <div className="flex items-center justify-between p-2 bg-slate-50 rounded border">
        <span>{value}</span>
        <button type="button" onClick={() => void copy(value, toast)} className="text-indigo-600">
          <i className="fa-regular fa-copy" />
        </button>
      </div>
      {hint && <p className="text-[10px] text-slate-400 font-sans mt-0.5">{hint}</p>}
    </div>
  );

  return (
    <Drawer>
      <div className="space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="space-y-1">
            <JobStatusBadge status={job.status} large />
            <h3 className="text-base font-bold text-slate-900">{job.jobType}</h3>
            <p className="font-mono text-[11px] text-slate-400">{job.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 border-b pb-1">Execution</h4>
          <dl className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <dt className="text-slate-400">Invoke Type:</dt>
              <dd className="font-bold text-slate-800">{job.invokeType}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Duration:</dt>
              <dd className="font-mono font-bold text-indigo-600">{formatDuration(job.startTime, job.endTime)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Start Time (Local):</dt>
              <dd className="text-slate-700">{new Date(job.startTime).toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-slate-400">End Time (Local):</dt>
              <dd className="text-slate-700">{job.endTime ? new Date(job.endTime).toLocaleString() : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3 text-xs">
          <h4 className="font-bold text-slate-900 border-b pb-1">Identifiers</h4>
          <div className="space-y-2 text-[11px] font-mono">
            {idRow('Job Instance ID:', job.id, 'Instance ID copied')}
            {idRow('Root Activity ID:', job.rootActivityId, 'Root Activity ID copied', 'Use this identifier to trace requests across Fabric services.')}
          </div>
        </div>

        {/* Failure Information Panel */}
        {job.status === 'Failed' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
            <h4 className="font-bold text-rose-900 flex items-center space-x-1.5">
              <i className="fa-solid fa-triangle-exclamation text-rose-600" />
              <span>Failure Details</span>
            </h4>
            <p className="text-[11px] font-mono">{errorText}</p>
            <button
              type="button"
              onClick={() => void copy(errorText, 'Error details copied')}
              className="px-2.5 py-1 bg-white border border-rose-300 rounded text-[11px] font-semibold text-rose-800 hover:bg-rose-100"
            >
              Copy Error Details
            </button>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200">
          Close Details
        </button>
      </div>
    </Drawer>
  );
}
