import type { JobInstance } from '@/types/fabric';

export function JobStats({ jobs }: { jobs: JobInstance[] }) {
  const inProgress = jobs.filter((j) => j.status === 'InProgress').length;
  const completed = jobs.filter((j) => j.status === 'Completed').length;
  const failed = jobs.filter((j) => j.status === 'Failed').length;
  const other = jobs.length - inProgress - completed - failed;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="text-slate-400 font-medium text-[11px]">Loaded Instances</div>
        <div className="text-xl font-bold text-slate-900">{jobs.length}</div>
        <div className="text-[10px] text-slate-400">Current page set</div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-sm space-y-1">
        <div className="text-amber-800 font-medium text-[11px] flex items-center justify-between">
          <span>In Progress</span>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        </div>
        <div className="text-xl font-bold text-amber-900">{inProgress}</div>
        <div className="text-[10px] text-amber-700">Active jobs</div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm space-y-1">
        <div className="text-emerald-800 font-medium text-[11px]">Completed</div>
        <div className="text-xl font-bold text-emerald-900">{completed}</div>
        <div className="text-[10px] text-emerald-700">Successful runs</div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-sm space-y-1">
        <div className="text-rose-800 font-medium text-[11px]">Failed</div>
        <div className="text-xl font-bold text-rose-900">{failed}</div>
        <div className="text-[10px] text-rose-700">Execution errors</div>
      </div>

      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1 col-span-2 sm:col-span-1">
        <div className="text-slate-400 font-medium text-[11px]">Other</div>
        <div className="text-xl font-bold text-slate-700">{other}</div>
        <div className="text-[10px] text-slate-400">Cancelled / Deduped</div>
      </div>
    </div>
  );
}
