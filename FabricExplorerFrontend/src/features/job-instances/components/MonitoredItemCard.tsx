import { useClipboard } from '@/hooks/useClipboard';
import { useConnection } from '@/providers/ConnectionProvider';
import type { FabricItem } from '@/types/fabric';
import { itemIcon } from '../utils';
import { ItemSelector } from './ItemSelector';

interface Props {
  item: FabricItem | null;
  items: FabricItem[];
  loadItems: () => Promise<void>;
  onSelect: (item: FabricItem) => void;
  onCreate: () => void;
}

export function MonitoredItemCard({ item, items, loadItems, onSelect, onCreate }: Props) {
  const copy = useClipboard();
  const { activeConnection } = useConnection();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
      {!item ? (
        /* UNSELECTED STATE */
        <div className="p-6 text-center bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-sm">
            <i className="fa-solid fa-cubes" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Select a Monitored Item</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Choose an existing Microsoft Fabric item or create a new item to start monitoring job execution instances.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <ItemSelector items={items} loadItems={loadItems} onSelect={onSelect}>
              {(toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center space-x-2"
                >
                  <i className="fa-solid fa-magnifying-glass" />
                  <span>Select Existing Item</span>
                  <i className="fa-solid fa-chevron-down text-[10px]" />
                </button>
              )}
            </ItemSelector>

            <span className="text-xs text-slate-400 font-medium">or</span>

            <button
              type="button"
              onClick={onCreate}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center space-x-2"
            >
              <i className="fa-solid fa-plus text-indigo-600" />
              <span>+ Create New Item</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Active Workspace: <strong className="text-slate-700">{activeConnection?.workspaceName || '—'}</strong>{' '}
            {activeConnection?.workspaceId && <span className="font-mono text-[10px]">({activeConnection.workspaceId})</span>}
          </p>
        </div>
      ) : (
        /* SELECTED ACTIVE MONITORED ITEM */
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
              <i className={`fa-solid ${itemIcon(item.type)}`} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">{item.type}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5 flex-wrap gap-1">
                <span>
                  Workspace: <strong className="text-slate-800">{item.workspace}</strong>
                </span>
                <span>•</span>
                <span>
                  Item ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{item.id}</code>
                </span>
                <button
                  type="button"
                  onClick={() => void copy(item.id, 'Item ID copied')}
                  className="text-slate-400 hover:text-indigo-600"
                  title="Copy Item ID"
                >
                  <i className="fa-regular fa-copy text-xs" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <ItemSelector items={items} loadItems={loadItems} onSelect={onSelect}>
              {(toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-arrow-right-arrow-left text-slate-400" />
                  <span>Change Item</span>
                </button>
              )}
            </ItemSelector>
            <button
              type="button"
              onClick={onCreate}
              className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-plus text-xs" />
              <span>Create Item</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
