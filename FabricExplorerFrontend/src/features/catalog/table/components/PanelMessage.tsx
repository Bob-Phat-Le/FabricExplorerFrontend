import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'error';

interface Props {
  icon: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: Tone;
  /** Dashed box that fills its parent (right panel) instead of an inline message (tree panel). */
  fill?: boolean;
}

const ICON_TONE: Record<Tone, string> = {
  neutral: 'bg-indigo-50 text-indigo-600',
  error: 'bg-rose-50 text-rose-600',
};

export function PanelMessage({ icon, title, children, action, tone = 'neutral', fill = false }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        fill ? 'flex-1 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50' : 'py-10 px-4',
      )}
    >
      <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-sm', ICON_TONE[tone])}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
      {children && <p className="text-xs text-slate-500 max-w-sm mt-1 break-words">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const SECONDARY_BUTTON =
  'px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center space-x-1.5';
