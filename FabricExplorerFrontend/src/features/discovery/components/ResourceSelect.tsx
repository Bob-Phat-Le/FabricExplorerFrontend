import type { ResourceList } from '../hooks/useResourceList';

interface Props {
  id: string;
  label: string;
  list: ResourceList;
  onSelectionChange: () => void;
}

export function ResourceSelect({ id, label, list, onSelectionChange }: Props) {
  const disabled = list.placeholder !== null;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
        <button type="button" onClick={() => void list.reload()} className="text-[11px] text-indigo-600 font-semibold hover:underline">
          Reload
        </button>
      </div>
      <select
        id={id}
        disabled={disabled}
        value={disabled ? '' : list.selectedId}
        onChange={(e) => {
          list.select(e.target.value);
          onSelectionChange();
        }}
        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
      >
        {disabled ? (
          <option value="">{list.placeholder}</option>
        ) : (
          list.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
