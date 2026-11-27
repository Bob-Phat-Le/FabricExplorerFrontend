import { useEffect, useRef } from 'react';
import { formatDateTime, timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { ConfigurationItem, ExportItemRef } from '@/types/configuration';
import { selectionKey, statusMeta, typeLabel } from '../utils';
import { Badge } from './Badge';

interface InventoryTableProps {
  items: ConfigurationItem[];
  loading: boolean;
  selected: ReadonlyMap<string, ExportItemRef>;
  pageSelectedCount: number;
  onToggle: (item: ConfigurationItem) => void;
  onTogglePage: (checked: boolean) => void;
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <tr key={i}>
          <td className="p-3 pl-4" colSpan={6}>
            <div className="h-3 rounded bg-slate-100 animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function InventoryTable({ items, loading, selected, pageSelectedCount, onToggle, onTogglePage }: InventoryTableProps) {
  const headRef = useRef<HTMLInputElement>(null);
  const allOnPage = items.length > 0 && pageSelectedCount === items.length;

  useEffect(() => {
    if (headRef.current) headRef.current.indeterminate = pageSelectedCount > 0 && !allOnPage;
  }, [pageSelectedCount, allOnPage]);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px]">
            <tr>
              <th className="p-3 pl-4 w-10">
                <input
                  ref={headRef}
                  type="checkbox"
                  aria-label="Select all on this page"
                  checked={allOnPage}
                  disabled={items.length === 0}
                  onChange={(e) => onTogglePage(e.target.checked)}
                />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Source</th>
              <th className="p-3">Updated</th>
              <th className="p-3 pr-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {loading && items.length === 0 ? (
              <SkeletonRows />
            ) : (
              items.map((item) => {
                const checked = selected.has(selectionKey(item.type, item.id));
                const status = statusMeta(item.status);
                return (
                  <tr
                    key={selectionKey(item.type, item.id)}
                    className={cn('transition-colors', checked ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60', loading && 'opacity-60')}
                  >
                    <td className="p-3 pl-4">
                      <input type="checkbox" aria-label={`Select ${item.name}`} checked={checked} onChange={() => onToggle(item)} />
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{item.name}</td>
                    <td className="p-3">
                      <Badge tone={item.type === 'Connection' ? 'indigo' : 'slate'} icon={item.type === 'Connection' ? 'fa-plug' : 'fa-terminal'}>
                        {typeLabel(item.type)}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500 max-w-[18rem]">
                      <div className={cn('truncate', item.type === 'Connection' && 'font-mono text-[11px]')} title={item.source ?? ''}>
                        {item.source ?? '—'}
                      </div>
                      {item.parentName && (
                        <div className="text-[10px] text-slate-400 truncate">
                          <i className="fa-solid fa-plug mr-1" />
                          {item.parentName}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap" title={formatDateTime(item.updatedAt)}>
                      {timeAgo(item.updatedAt)}
                    </td>
                    <td className="p-3 pr-4 text-right">
                      <Badge tone={status.tone} icon={status.icon}>
                        {status.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && items.length === 0 && (
        <div className="p-8 text-center space-y-2 bg-slate-50/50">
          <i className="fa-solid fa-folder-open text-3xl text-slate-300" />
          <p className="text-xs font-bold text-slate-700">No matching configurations found</p>
          <p className="text-[11px] text-slate-400">Try adjusting your search or filters, or import a configuration file.</p>
        </div>
      )}
    </div>
  );
}
