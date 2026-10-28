
interface RadioCardProps {
  name: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}

const BASE = 'cursor-pointer rounded-xl p-3.5 flex flex-col justify-between';
const ON = `${BASE} border-2 border-indigo-600 bg-indigo-50/30 transition-all`;
const OFF = `${BASE} border border-slate-200 hover:border-indigo-300 transition-all`;

/** Thẻ chọn một trong nhiều (radio) dùng trong các bước wizard. */
export function RadioCard({ name, value, selected, onSelect, title, description }: RadioCardProps) {
  return (
    <label className={selected ? ON : OFF}>
      <div className="flex items-start justify-between">
        <span className="font-semibold text-xs text-slate-800">{title}</span>
        <input
          type="radio"
          name={name}
          value={value}
          checked={selected}
          onChange={onSelect}
          className="text-indigo-600 focus:ring-indigo-500"
        />
      </div>
      <p className="text-[11px] text-slate-500 mt-2">{description}</p>
    </label>
  );
}
