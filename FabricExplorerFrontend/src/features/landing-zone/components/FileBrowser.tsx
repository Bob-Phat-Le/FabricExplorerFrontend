import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import type { LandingZoneItem, LandingZoneSortField } from '@/types/landingZone';
import type { LandingZoneState } from '../hooks/useLandingZone';
import { PAGE_SIZE, displayPath, formatBytes, iconOf, parentOf, pathTrail } from '../utils';

interface Props {
  state: LandingZoneState;
  onOpenFile: (item: LandingZoneItem) => void;
  onUpload: () => void;
  onNewFolder: () => void;
  onRename: (item: LandingZoneItem) => void;
  onDelete: (items: LandingZoneItem[]) => void;
  onTransfer: (mode: 'move' | 'copy', items: LandingZoneItem[]) => void;
}

const BTN = 'p-1.5 text-slate-400 rounded-lg transition-colors';

function Breadcrumbs({ state }: { state: LandingZoneState }) {
  const trail = pathTrail(state.currentPath);
  const crumb = (label: string, path: string, last: boolean, root = false) => (
    <button
      key={path || 'root'}
      type="button"
      onClick={() => state.navigate(path)}
      className={cn(
        'px-1.5 py-0.5 rounded-md transition-colors',
        last ? 'font-bold text-indigo-700 bg-indigo-50/70' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100',
      )}
    >
      {root && <i className="fa-solid fa-hard-drive text-[10px] mr-1 text-indigo-600" />}
      {label}
    </button>
  );

  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 min-h-[34px]">
      {crumb('Landing Zone', '', trail.length === 0, true)}
      {trail.map((t, i) => (
        <span key={t.path} className="flex items-center gap-1">
          <i className="fa-solid fa-chevron-right text-[9px] text-slate-400 mx-1" />
          {crumb(t.name, t.path, i === trail.length - 1)}
        </span>
      ))}
    </nav>
  );
}

function SortHeader({ field, label, state, className }: { field: LandingZoneSortField; label: string; state: LandingZoneState; className?: string }) {
  const active = state.sortField === field;
  return (
    <th className={cn('p-3 cursor-pointer hover:text-slate-800 select-none', className)} onClick={() => state.sortBy(field)}>
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <i className={cn('fa-solid text-[10px]', active ? (state.sortAsc ? 'fa-sort-up text-indigo-600' : 'fa-sort-down text-indigo-600') : 'fa-sort text-slate-400')} />
      </div>
    </th>
  );
}

export function FileBrowser({ state, onOpenFile, onUpload, onNewFolder, onRename, onDelete, onTransfer }: Props) {
  const { items, selected, selectedItems, recursiveSearch } = state;
  const open = (item: LandingZoneItem) => (item.isFolder ? state.navigate(item.path) : onOpenFile(item));
  const empty = state.listState !== 'loading' && !state.searching && items.length === 0;
  const startIdx = (state.page - 1) * PAGE_SIZE;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* toolbar */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 space-y-3 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <Breadcrumbs state={state} />
          <div className="flex items-center flex-wrap gap-2 shrink-0">
            <button type="button" onClick={onUpload} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5">
              <i className="fa-solid fa-cloud-arrow-up" />
              <span>Upload</span>
            </button>
            <button type="button" onClick={onNewFolder} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5">
              <i className="fa-solid fa-folder-plus text-amber-500" />
              <span>New Folder</span>
            </button>
            <button type="button" onClick={() => void state.refresh()} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors" title="Refresh Current Folder">
              <i className={cn('fa-solid fa-arrows-rotate text-xs', state.listState === 'loading' && 'fa-spin')} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 flex-1 max-w-xl">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
              <input
                type="text"
                value={state.searchText}
                onChange={(e) => {
                  state.setSearchText(e.target.value);
                  state.setPage(1);
                }}
                placeholder="Search by name or extension (e.g. .csv, _metadata.json)..."
                className="w-full text-xs pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {state.searchText && (
                <button type="button" onClick={() => state.setSearchText('')} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                  <i className="fa-solid fa-xmark text-xs" />
                </button>
              )}
            </div>
            <select
              value={state.searchScope}
              onChange={(e) => state.setSearchScope(e.target.value as 'current' | 'recursive')}
              className="text-xs font-semibold text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              title="Search Scope"
            >
              <option value="current">Current Folder</option>
              <option value="recursive">Entire Landing Zone</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {state.totalItems} item{state.totalItems === 1 ? '' : 's'}
              {state.truncated && !recursiveSearch ? '+' : ''}
            </span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5">
              {(['list', 'grid'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => state.setViewMode(mode)}
                  title={mode === 'list' ? 'List View' : 'Grid View'}
                  className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors', state.viewMode === mode ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800')}
                >
                  <i className={cn('fa-solid', mode === 'list' ? 'fa-list' : 'fa-grip')} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {state.truncated && !recursiveSearch && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            This folder has more items than can be listed; only the first ones are shown. Use the search to find a specific item.
          </p>
        )}

        {selected.size > 0 && (
          <div className="bg-indigo-600 text-white px-3.5 py-2 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-sm">
            <div className="flex items-center space-x-2 font-bold">
              <span className="bg-white/20 px-2 py-0.5 rounded-md font-mono">{selected.size}</span>
              <span>items selected</span>
            </div>
            <div className="flex items-center flex-wrap gap-1.5">
              <button type="button" onClick={() => void state.downloadItems(selectedItems)} className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg font-semibold transition-colors flex items-center space-x-1">
                <i className="fa-solid fa-download text-[11px]" />
                <span>Download</span>
              </button>
              <button type="button" onClick={() => onTransfer('move', selectedItems)} className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg font-semibold transition-colors flex items-center space-x-1">
                <i className="fa-solid fa-arrow-right-to-bracket text-[11px]" />
                <span>Move</span>
              </button>
              <button type="button" onClick={() => onTransfer('copy', selectedItems)} className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg font-semibold transition-colors flex items-center space-x-1">
                <i className="fa-regular fa-copy text-[11px]" />
                <span>Copy</span>
              </button>
              <button type="button" onClick={() => onDelete(selectedItems)} className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 rounded-lg font-bold transition-colors flex items-center space-x-1">
                <i className="fa-regular fa-trash-can text-[11px]" />
                <span>Delete</span>
              </button>
              <div className="h-4 w-px bg-white/25 mx-1" />
              <button type="button" onClick={state.clearSelection} className="px-2 py-1 hover:bg-white/15 rounded-lg text-indigo-100 hover:text-white font-medium">
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto relative min-h-0">
        {(state.listState === 'loading' || state.searching) && items.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            <i className="fa-solid fa-spinner fa-spin mr-2" />
            {state.searching ? 'Searching…' : 'Loading…'}
          </div>
        )}

        {state.listState === 'error' && !recursiveSearch && (
          <div className="p-12 text-center space-y-2">
            <p className="text-xs font-bold text-rose-700">Could not load this folder</p>
            <p className="text-[11px] text-slate-500">{state.listError}</p>
            <button type="button" onClick={() => state.navigate('')} className="px-3 py-1.5 bg-white border border-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-50">
              Go to Landing Zone root
            </button>
          </div>
        )}

        {empty && state.listState !== 'error' && (
          <div className="p-12 text-center space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
              <i className="fa-regular fa-folder-open" />
            </div>
            <p className="text-xs font-bold text-slate-800">{state.searchText ? 'No matching items' : 'This folder is empty'}</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {state.searchText ? 'Try a different name or search the entire Landing Zone.' : 'Upload files or create a subfolder to get started.'}
            </p>
            {!state.searchText && (
              <div className="pt-2">
                <button type="button" onClick={onUpload} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                  Upload Files
                </button>
              </div>
            )}
          </div>
        )}

        {!empty && items.length > 0 && state.viewMode === 'list' && (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-[11px] sticky top-0 z-10">
              <tr>
                <th className="p-3 pl-4 w-10">
                  <input type="checkbox" checked={state.allSelected} onChange={(e) => state.selectAll(e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </th>
                <SortHeader field="name" label="Name" state={state} />
                {recursiveSearch && <th className="p-3">Location Path</th>}
                <SortHeader field="type" label="Type" state={state} className="w-28" />
                <SortHeader field="size" label="Size" state={state} className="w-28" />
                <SortHeader field="modified" label="Modified" state={state} className="w-44" />
                <th className="p-3 pr-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {items.map((item) => {
                const icon = iconOf(item);
                const isSelected = selected.has(item.path);
                return (
                  <tr
                    key={item.path}
                    onClick={item.isFolder ? undefined : () => onOpenFile(item)}
                    onDoubleClick={item.isFolder ? () => state.navigate(item.path) : undefined}
                    className={cn('hover:bg-slate-50 transition-colors cursor-pointer group', isSelected && 'bg-indigo-50/50')}
                  >
                    <td className="p-3 pl-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={(e) => state.toggleSelected(item.path, e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2.5">
                        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0', icon.bg, icon.color)}>
                          <i className={icon.icon} />
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors break-all">{item.name}</span>
                      </div>
                    </td>
                    {recursiveSearch && <td className="p-3 font-mono text-[11px] text-slate-400 break-all">{displayPath(parentOf(item.path))}</td>}
                    <td className="p-3">
                      <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold font-mono', item.isFolder ? 'bg-amber-50 text-amber-700 border border-amber-200/70' : 'bg-slate-100 text-slate-600')}>
                        {item.isFolder ? 'Folder' : (item.extension ?? 'file').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{item.isFolder ? '—' : formatBytes(item.sizeBytes)}</td>
                    <td className="p-3 font-mono text-slate-500 text-[11px]">{formatDateTime(item.lastModified)}</td>
                    <td className="p-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center space-x-1">
                        {item.isFolder ? (
                          <button type="button" onClick={() => state.navigate(item.path)} className={cn(BTN, 'hover:text-indigo-600 hover:bg-indigo-50')} title="Open Folder">
                            <i className="fa-solid fa-folder-open text-xs" />
                          </button>
                        ) : (
                          <button type="button" onClick={() => void state.downloadItems([item])} className={cn(BTN, 'hover:text-indigo-600 hover:bg-indigo-50')} title="Download File">
                            <i className="fa-solid fa-download text-xs" />
                          </button>
                        )}
                        <button type="button" onClick={() => onRename(item)} className={cn(BTN, 'hover:text-slate-700 hover:bg-slate-100')} title="Rename">
                          <i className="fa-solid fa-pen text-[11px]" />
                        </button>
                        <button type="button" onClick={() => onDelete([item])} className={cn(BTN, 'hover:text-rose-600 hover:bg-rose-50')} title="Delete">
                          <i className="fa-regular fa-trash-can text-xs" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!empty && items.length > 0 && state.viewMode === 'grid' && (
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {items.map((item) => {
              const icon = iconOf(item);
              const isSelected = selected.has(item.path);
              return (
                <div
                  key={item.path}
                  onClick={item.isFolder ? undefined : () => onOpenFile(item)}
                  onDoubleClick={item.isFolder ? () => open(item) : undefined}
                  className={cn(
                    'p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between',
                    isSelected ? 'border-indigo-500 bg-indigo-50/40' : 'border-slate-200 bg-white hover:border-indigo-300',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-base', icon.bg, icon.color)}>
                      <i className={icon.icon} />
                    </div>
                    <input type="checkbox" checked={isSelected} onClick={(e) => e.stopPropagation()} onChange={(e) => state.toggleSelected(item.path, e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                  </div>
                  <div className="mt-3">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600" title={item.name}>{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {item.isFolder ? 'Folder' : `${(item.extension ?? 'file').toUpperCase()} · ${formatBytes(item.sizeBytes)}`}
                    </p>
                    {recursiveSearch && <p className="text-[9px] text-slate-400 font-mono truncate mt-0.5">{displayPath(parentOf(item.path))}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span>
          {state.totalItems === 0 ? 'Showing 0 items' : `Showing ${startIdx + 1}–${Math.min(startIdx + PAGE_SIZE, state.totalItems)} of ${state.totalItems} items`}
        </span>
        <div className="flex items-center space-x-1.5">
          <button type="button" disabled={state.page <= 1} onClick={() => state.setPage(state.page - 1)} className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium">
            Previous
          </button>
          <span className="px-2 font-mono font-semibold text-slate-700">Page {state.page} of {state.totalPages}</span>
          <button type="button" disabled={state.page >= state.totalPages} onClick={() => state.setPage(state.page + 1)} className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50 font-medium">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
