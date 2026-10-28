import { useState } from 'react';
import type { JobInstance } from '@/types/fabric';
import { formatDuration, shortId } from '../utils';
import { JobStatusBadge } from './JobStatusBadge';

interface Props {
  jobs: JobInstance[];
  onInspect: (job: JobInstance) => void;
  onLoadNext: () => void;
}

const SELECT = 'text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-medium outline-none';

export function JobsTable({ jobs, onInspect, onLoadNext }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [invoke, setInvoke] = useState('All');
  const [jobType, setJobType] = useState('All');

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar Controls Header */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="relative w-full md:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job type, instance ID, root activity ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto flex-wrap gap-2 justify-end">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
            <option value="All">All Statuses</option>
            <option value="InProgress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Deduped">Deduped</option>
            <option value="NotStarted">Not Started</option>
          </select>
          <select value={invoke} onChange={(e) => setInvoke(e.target.value)} className={SELECT}>
            <option value="All">All Invoke Types</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Manual">Manual</option>
          </select>
          <select value={jobType} onChange={(e) => setJobType(e.target.value)} className={SELECT}>
            <option value="All">All Job Types</option>
            <option value="DefaultJob">DefaultJob</option>
            <option value="DataPipeline">DataPipeline</option>
            <option value="NotebookJob">NotebookJob</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="text-slate-500 font-semibold border-b border-slate-200 sticky top-0 bg-slate-50 z-10">
              <th className="p-3 pl-4">Status</th>
              <th className="p-3">Job Type</th>
              <th className="p-3">Invoke Type</th>
              <th className="p-3">Started</th>
              <th className="p-3">Ended</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Instance ID</th>
              <th className="p-3 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  <i className="fa-solid fa-clock-rotate-left text-2xl mb-2 block" />
                  <span>No job instances available for this item.</span>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="p-3 pl-4">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="p-3 font-mono text-slate-900 font-semibold">{job.jobType}</td>
                  <td className="p-3">{job.invokeType}</td>
                  <td className="p-3 text-slate-500">{new Date(job.startTime).toLocaleTimeString()}</td>
                  <td className="p-3 text-slate-500">{job.endTime ? new Date(job.endTime).toLocaleTimeString() : '—'}</td>
                  <td className="p-3 font-mono text-indigo-600 font-semibold">{formatDuration(job.startTime, job.endTime)}</td>
                  <td className="p-3 font-mono text-slate-400">{shortId(job.id)}</td>
                  <td className="p-3 text-right pr-4">
                    <button type="button" onClick={() => onInspect(job)} className="text-indigo-600 font-semibold hover:underline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CONTINUATION PAGINATION FOOTER */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <span>More job instances available for this item</span>
        <button
          type="button"
          onClick={onLoadNext}
          className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 rounded-lg shadow-sm transition-colors flex items-center space-x-2"
        >
          <span>Load Next Page</span>
          <i className="fa-solid fa-chevron-down text-slate-400 text-[10px]" />
        </button>
      </div>
    </div>
  );
}
