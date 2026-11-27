import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { TONE_CLASS, type Tone } from '../utils';

export function Badge({ tone, icon, children, className }: { tone: Tone; icon?: string; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1 border text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon && <i className={`fa-solid ${icon} text-[9px]`} />}
      <span>{children}</span>
    </span>
  );
}
