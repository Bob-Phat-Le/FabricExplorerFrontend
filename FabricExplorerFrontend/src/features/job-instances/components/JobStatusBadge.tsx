import type { JobStatus } from '@/types/fabric';

const BASE = 'px-2 py-0.5 rounded text-[11px] font-semibold';

export function JobStatusBadge({ status, large = false }: { status: JobStatus; large?: boolean }) {
  const size = large ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold' : BASE;
  switch (status) {
    case 'Completed':
      return <span className={`${size} bg-emerald-50 text-emerald-700 border border-emerald-200`}>● Completed</span>;
    case 'InProgress':
      return <span className={`${size} bg-amber-50 text-amber-700 border border-amber-200`}>● In Progress</span>;
    case 'Failed':
      return <span className={`${size} bg-rose-50 text-rose-700 border border-rose-200`}>✕ Failed</span>;
    default:
      return <span className={`${size} bg-slate-100 text-slate-600`}>{status}</span>;
  }
}
