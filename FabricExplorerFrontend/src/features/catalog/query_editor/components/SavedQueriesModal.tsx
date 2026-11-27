import { Pagination } from '@/features/connection/components/Pagination';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import { PanelMessage, SECONDARY_BUTTON } from '@/features/catalog/table/components/PanelMessage';
import { useClipboard } from '@/hooks/useClipboard';
import { cn } from '@/lib/cn';
import type { Connection } from '@/types/connection';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import type { SavedQueryScope } from '@/types/savedQuery/SavedQueryScope';
import { SAVED_QUERIES_PAGE_SIZE } from '../constants';
import { useSavedQueries } from '../hooks/useSavedQueries';
import { SavedQueryPreview } from './SavedQueryPreview';
import { SavedQueryTable } from './SavedQueryTable';

interface SavedQueriesModalProps {
  connection: Connection | null;
  onLoad: (query: SavedQuery) => void;
  onClose: () => void;
}

const SCOPES: ReadonlyArray<{ value: SavedQueryScope; label: string }> = [
  { value: 'connection', label: 'This connection' },
  { value: 'all', label: 'All connections' },
];

export function SavedQueriesModal({ connection, onLoad, onClose }: SavedQueriesModalProps) {
  const list = useSavedQueries(connection?.id);
  const copy = useClipboard();

  const selected = list.selected;
  // a query's target item lives in the workspace of the connection it was saved for
  const blockedReason =
    selected && selected.connectionId !== connection?.id
      ? `Saved for “${selected.connectionName ?? 'another connection'}”. Make it the active connection to load this query.`
      : null;

  const total = list.data?.totalItems ?? 0;
  const empty = list.state === 'ready' && list.items.length === 0;

  return (
    <Modal maxWidth="max-w-5xl">
      <div className="-m-6 flex flex-col h-[75vh] max-h-[650px] overflow-hidden rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
              <i className="fa-solid fa-folder-open" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Saved Queries</h3>
              <p className="text-xs text-slate-500 mt-0.5">Browse your saved queries and load one into the editor</p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={list.search}
                onChange={(e) => list.setSearch(e.target.value)}
                placeholder="Search by name, item or SQL..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
              {SCOPES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => list.setScope(s.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] transition-all',
                    list.scope === s.value ? 'bg-white text-indigo-600 font-bold shadow-sm' : 'text-slate-600 hover:text-slate-900 font-semibold',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px]">
            {total} {total === 1 ? 'Query' : 'Queries'}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row">
          <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-white">
            <div className={cn('flex-1 overflow-y-auto', list.state === 'loading' && list.items.length > 0 && 'opacity-60')}>
              {list.blocked ? (
                <PanelMessage icon="fa-plug" title="No active connection">
                  Set an active connection, or switch to “All connections”.
                </PanelMessage>
              ) : list.state === 'error' ? (
                <PanelMessage
                  tone="error"
                  icon="fa-triangle-exclamation"
                  title="Could not load saved queries"
                  action={
                    <button type="button" onClick={list.reload} className={SECONDARY_BUTTON}>
                      <i className="fa-solid fa-rotate-right text-slate-400" />
                      <span>Try again</span>
                    </button>
                  }
                >
                  {list.error}
                </PanelMessage>
              ) : list.state === 'loading' && list.items.length === 0 ? (
                <div className="p-6 space-y-3">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-3 rounded bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : empty ? (
                <PanelMessage icon="fa-bookmark" title={list.search.trim() ? 'No saved query matches your search' : 'No saved queries yet'}>
                  {list.search.trim() ? 'Try a different search.' : 'Write a query and press “Save Query” to keep it here.'}
                </PanelMessage>
              ) : (
                <SavedQueryTable list={list} onCopy={(sql) => void copy(sql, 'SQL copied')} />
              )}
            </div>

            {list.data && total > 0 && (
              <div className="px-6 pb-3 shrink-0">
                <Pagination
                  page={list.page}
                  pageSize={list.data.pageSize || SAVED_QUERIES_PAGE_SIZE}
                  total={total}
                  totalPages={list.data.totalPages}
                  count={list.items.length}
                  onChange={list.setPage}
                />
              </div>
            )}
          </div>

          <SavedQueryPreview
            query={selected}
            blockedReason={blockedReason}
            onLoad={() => selected && onLoad(selected)}
            onCopy={() => selected && void copy(selected.sql, 'SQL copied')}
          />
        </div>
      </div>
    </Modal>
  );
}
