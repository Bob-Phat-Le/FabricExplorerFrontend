import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import type { LandingZoneOperation } from '@/types/landingZone';

export function OperationsPanel({ operations }: { operations: LandingZoneOperation[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full px-5 py-3 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left">
        <div className="flex items-center space-x-2.5">
          <i className="fa-solid fa-clock-rotate-left text-indigo-600 text-xs" />
          <span className="text-xs font-bold text-slate-900">Recent Operations</span>
          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">{operations.length}</span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="text-[11px]">{open ? 'Click to collapse' : 'Click to expand'}</span>
          <i className={cn('fa-solid fa-chevron-down text-[10px] transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-200 overflow-x-auto">
          {operations.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No operations yet.</p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-2.5 pl-5">Operation</th>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Folder</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5 pr-5 text-right">Diagnostics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {operations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50">
                    <td className="p-2.5 pl-5 font-bold text-slate-800">{op.operation}</td>
                    <td className="p-2.5 font-mono text-indigo-700 font-semibold break-all">{op.item}</td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-500 break-all">{op.path}</td>
                    <td className="p-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold border', op.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200')}>
                        {op.status}
                      </span>
                    </td>
                    <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">{formatDateTime(op.createdAt)}</td>
                    <td className="p-2.5 pr-5 text-right text-[11px] text-slate-500">{op.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
