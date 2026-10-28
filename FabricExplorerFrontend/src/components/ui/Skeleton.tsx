import { cn } from '@/lib/cn';

export function Skeleton({ width = 'w-12' }: { width?: string }) {
  return (
    <span
      className={cn('inline-block h-3 rounded bg-slate-200 animate-pulse align-middle', width)}
      title="Loading…"
    />
  );
}
