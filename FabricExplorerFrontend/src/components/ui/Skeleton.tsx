import { cn } from '@/lib/cn';

/** Placeholder cho trường số/ngày đang chờ dữ liệu streaming. `width` là class Tailwind, ví dụ "w-12". */
export function Skeleton({ width = 'w-12' }: { width?: string }) {
  return (
    <span
      className={cn('inline-block h-3 rounded bg-slate-200 animate-pulse align-middle', width)}
      title="Loading…"
    />
  );
}
