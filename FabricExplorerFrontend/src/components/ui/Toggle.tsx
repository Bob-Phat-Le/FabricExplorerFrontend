import { cn } from '@/lib/cn';

const TRACK = {
  sm: "w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600",
  md: "w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600",
} as const;

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: keyof typeof TRACK;
  className?: string;
}

export function Toggle({ checked, onChange, size = 'md', className }: ToggleProps) {
  return (
    <label className={cn('relative inline-flex items-center cursor-pointer', className)}>
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className={TRACK[size]} />
    </label>
  );
}
