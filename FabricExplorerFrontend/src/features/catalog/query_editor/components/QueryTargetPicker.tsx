import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { cn } from '@/lib/cn';
import type { FabricItemType } from '@/types/fabric';
import type { QueryTargetItem } from '@/types/savedQuery/QueryTargetItem';
import { TARGET_SOURCE_LIST, TARGET_SOURCES } from '../targets/targetSources';

interface QueryTargetPickerProps {
  items: readonly QueryTargetItem[];
  selectedId: string | null;
  onSelect: (item: QueryTargetItem) => void;
  /** Content of the button that opens the popover. */
  children: ReactNode;
  buttonClassName: string;
  align?: 'left' | 'right';
}

const CHIP = 'px-2 py-0.5 rounded text-[10px]';

/** Popover with search and kind filter. Used for both "Select Existing Item" and "Change Item". */
export function QueryTargetPicker({ items, selectedId, onSelect, children, buttonClassName, align = 'left' }: QueryTargetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<FabricItemType | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(
      (i) => (!kind || i.type === kind) && (!term || i.name.toLowerCase().includes(term) || i.id.toLowerCase().includes(term)),
    );
  }, [items, search, kind]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox" className={buttonClassName}>
        {children}
      </button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-2 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items by name or ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-1 border-b border-slate-100 pb-2">
            <button type="button" onClick={() => setKind(null)} className={cn(CHIP, !kind ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-100 text-slate-600')}>
              All
            </button>
            {TARGET_SOURCE_LIST.map((s) => (
              <button
                key={s.type}
                type="button"
                onClick={() => setKind(s.type)}
                className={cn(CHIP, kind === s.type ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-100 text-slate-600')}
              >
                {s.chip}
              </button>
            ))}
          </div>

          <div role="listbox" className="space-y-1 max-h-56 overflow-y-auto pr-1">
            {visible.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-400">No item matches your search.</p>
            ) : (
              visible.map((item) => {
                const active = item.id === selectedId;
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={cn(
                      'w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors border',
                      active ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-slate-100 hover:border-slate-200',
                    )}
                  >
                    <span className="flex items-center space-x-2.5 min-w-0">
                      <i className={`fa-solid ${TARGET_SOURCES[item.type].icon} text-indigo-600 text-xs shrink-0`} />
                      <span className="min-w-0">
                        <span className="block font-bold text-slate-800 text-xs truncate">{item.name}</span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {item.workspaceName ?? 'Workspace'} · {TARGET_SOURCES[item.type].label}
                        </span>
                      </span>
                    </span>
                    {active && <i className="fa-solid fa-check text-indigo-600 text-xs shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
