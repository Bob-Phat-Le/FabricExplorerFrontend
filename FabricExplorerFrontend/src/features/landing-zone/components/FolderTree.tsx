import { cn } from '@/lib/cn';
import type { LandingZoneState } from '../hooks/useLandingZone';

function TreeNode({ path, name, depth, state }: { path: string; name: string; depth: number; state: LandingZoneState }) {
  const kids = state.children[path];
  const open = state.expanded.has(path);
  const loading = state.loadingFolders.has(path);
  const selected = state.currentPath === path;
  // folders are loaded lazily: until a folder is opened it may have children
  const mayHaveChildren = kids === undefined || kids.length > 0;

  return (
    <div>
      <div
        onClick={() => state.navigate(path)}
        style={{ paddingLeft: depth * 14 + 8 }}
        className={cn(
          'flex items-center space-x-1.5 py-1.5 pr-2 rounded-lg border cursor-pointer transition-colors',
          selected ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200' : 'text-slate-700 hover:bg-slate-100 border-transparent',
        )}
      >
        {mayHaveChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              state.toggleExpand(path);
            }}
            className="w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <i className={cn('fa-solid text-[9px]', loading ? 'fa-spinner fa-spin' : open ? 'fa-chevron-down' : 'fa-chevron-right')} />
          </button>
        ) : (
          <span className="w-4 h-4 inline-block" />
        )}
        <i
          className={cn(
            'fa-solid text-xs shrink-0',
            path === '' ? 'fa-hard-drive' : open && kids && kids.length > 0 ? 'fa-folder-open' : 'fa-folder',
            selected ? 'text-indigo-600' : path === '' ? 'text-indigo-500' : 'text-amber-500',
          )}
        />
        <span className="truncate">{name}</span>
      </div>

      {open && kids?.map((f) => <TreeNode key={f.path} path={f.path} name={f.name} depth={depth + 1} state={state} />)}
    </div>
  );
}

export function FolderTree({ state, onNewFolder }: { state: LandingZoneState; onNewFolder: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
        <div className="flex items-center space-x-2">
          <i className="fa-solid fa-folder-tree text-indigo-600 text-xs" />
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Folders</h2>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onNewFolder}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="New Folder in Current Location"
          >
            <i className="fa-solid fa-folder-plus text-xs" />
          </button>
          <button
            type="button"
            onClick={() => void state.refresh()}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="Refresh Folder Tree"
          >
            <i className="fa-solid fa-arrows-rotate text-xs" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 text-xs select-none">
        <TreeNode path="" name="Landing Zone" depth={0} state={state} />
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
        <span>Hierarchy view</span>
        <button
          type="button"
          disabled={state.expandingAll}
          onClick={() => void state.expandAll()}
          className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:underline disabled:opacity-100 disabled:cursor-wait"
        >
          {state.expandingAll && <i className="fa-solid fa-spinner fa-spin text-sm" />}
          {state.expandingAll ? 'Expanding…' : 'Expand All'}
        </button>
      </div>
    </div>
  );
}
