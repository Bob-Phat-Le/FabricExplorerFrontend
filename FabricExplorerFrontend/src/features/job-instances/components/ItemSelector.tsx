import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useToast } from '@/providers/ToastProvider';
import type { FabricItem } from '@/types/fabric';
import { shortId } from '../utils';

interface Props {
  items: FabricItem[];
  loadItems: () => Promise<void>;
  onSelect: (item: FabricItem) => void;
  /** Nút kích hoạt menu; nhận `toggle`. */
  children: (toggle: () => void) => ReactNode;
}

const TYPE_FILTERS = [
  { label: 'All', active: true },
  { label: 'Lakehouse' },
  { label: 'Warehouse' },
  { label: 'Mirrored DB' },
];

/** Nút + menu chọn item có sẵn. Dùng ở cả trạng thái chưa chọn và "Change Item". */
export function ItemSelector({ items, loadItems, onSelect, children }: Props) {
  const { showApiError } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const toggle = async () => {
    setOpen((o) => !o);
    try {
      await loadItems();
    } catch (err) {
      showApiError(err, 'Could not load items');
    }
  };

  return (
    <div className="relative" ref={ref}>
      {children(() => void toggle())}

      {open && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2">
          {/* TODO: tìm kiếm / lọc theo loại vốn là hàm rỗng trong bản gốc — giữ nguyên, chưa lọc. */}
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by name or ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 text-[10px]">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                className={f.active ? 'px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold' : 'px-2 py-0.5 rounded hover:bg-slate-100 text-slate-600'}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  onSelect(item);
                }}
                className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{shortId(item.id)}</div>
                </div>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
