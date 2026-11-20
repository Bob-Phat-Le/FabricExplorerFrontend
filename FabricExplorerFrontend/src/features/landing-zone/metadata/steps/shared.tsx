import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { FormatOption } from '@/types/landingZone';

export const INPUT = 'w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 outline-none';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block font-semibold text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

export function JsonBlock({ json, empty, className = '' }: { json: string | null | undefined; empty: string; className?: string }) {
  return (
    <pre className={`font-mono text-xs leading-relaxed overflow-auto ${json ? 'text-emerald-400' : 'text-slate-500'} ${className}`}>
      {json || empty}
    </pre>
  );
}

export function ErrorList({ errors, title }: { errors: string[]; title: string }) {
  if (errors.length === 0) return null;
  return (
    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 space-y-1">
      <p className="font-bold flex items-center space-x-1.5">
        <i className="fa-solid fa-circle-exclamation" />
        <span>{title}</span>
      </p>
      <ul className="list-disc pl-5 space-y-0.5">
        {errors.map((e) => (
          <li key={e}>{e}</li>
        ))}
      </ul>
    </div>
  );
}

interface OptionFieldProps {
  option: FormatOption;
  value: string;
  onChange: (value: string) => void;
}

/** Renders one format option from its backend descriptor. */
export function OptionField({ option, value, onChange }: OptionFieldProps) {
  const label = option.required ? option.label : `${option.label} (optional)`;

  return (
    <Field label={label} hint={option.hint ?? undefined}>
      {option.kind === 'Choice' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} disabled={option.readOnly} className={INPUT}>
          {(option.choices ?? []).map((choice) => (
            <option key={choice} value={choice}>{choice}</option>
          ))}
        </select>
      ) : option.kind === 'Flag' ? (
        <input readOnly value={value} className={cn(INPUT, 'bg-slate-100 text-slate-500')} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} readOnly={option.readOnly} className={cn(INPUT, option.readOnly && 'bg-slate-100 text-slate-500')} />
      )}
    </Field>
  );
}
