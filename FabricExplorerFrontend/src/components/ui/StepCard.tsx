import type { ReactNode } from 'react';

interface StepCardProps {
  number: number;
  total: number;
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function StepCard({ number, total, title, description, badge, children }: StepCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs flex items-center justify-center font-bold">
              {number}
            </span>
            <span>{`Step ${number}: ${title}`}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
        {badge ?? (
          <span className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2.5 py-1 rounded-full">
            {`Step ${number} of ${total}`}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export function ReadyBadge({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      {children}
    </span>
  );
}
