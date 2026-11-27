import { useMemo } from 'react';
import { MAX_ROWS_OPTIONS } from '../constants';

const UNLIMITED = 'unlimited';

interface MaxRowsSelectProps {
  /** null = unlimited */
  value: number | null;
  onChange: (value: number | null) => void;
}

export function MaxRowsSelect({ value, onChange }: MaxRowsSelectProps) {
  // a loaded saved query can carry a limit that is not one of the presets (e.g. imported): keep it selectable
  const options = useMemo(() => {
    const presets: number[] = [...MAX_ROWS_OPTIONS];
    return value !== null && !presets.includes(value) ? [...presets, value].sort((a, b) => a - b) : presets;
  }, [value]);

  return (
    <div className="flex items-center space-x-2 bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
      <label htmlFor="queryMaxRowsSelect" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
        <i className="fa-solid fa-list-ol text-[10px] text-indigo-400" />
        <span>Max Row:</span>
      </label>
      <select
        id="queryMaxRowsSelect"
        value={value === null ? UNLIMITED : String(value)}
        onChange={(e) => onChange(e.target.value === UNLIMITED ? null : Number(e.target.value))}
        className="bg-slate-800 text-emerald-400 border border-slate-700/60 rounded px-2 py-0.5 text-xs font-mono font-semibold outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
      >
        {options.map((n) => (
          <option key={n} value={n}>
            {n.toLocaleString()}
          </option>
        ))}
        <option value={UNLIMITED}>Unlimited</option>
      </select>
    </div>
  );
}
