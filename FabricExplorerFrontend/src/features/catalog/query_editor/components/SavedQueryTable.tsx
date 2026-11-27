import { useState } from 'react';
import type { SavedQueriesState } from '../hooks/SavedQueriesState';
import { SavedQueryRow } from './SavedQueryRow';

interface SavedQueryTableProps {
  list: SavedQueriesState;
  onCopy: (sql: string) => void;
}

export function SavedQueryTable({ list, onCopy }: SavedQueryTableProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const showConnection = list.scope === 'all';

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    await list.remove(id);
    setDeletingId(null);
    setConfirmingId(null);
  };

  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead className="sticky top-0 bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 z-10 text-[11px]">
        <tr>
          <th className="p-3 pl-6">Query Name</th>
          <th className="p-3">Target Item</th>
          {showConnection && <th className="p-3">Connection</th>}
          <th className="p-3">Saved</th>
          <th className="p-3 pr-6 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
        {list.items.map((query) => (
          <SavedQueryRow
            key={query.id}
            query={query}
            selected={list.selected?.id === query.id}
            showConnection={showConnection}
            confirmingDelete={confirmingId === query.id}
            deleting={deletingId === query.id}
            onSelect={() => list.select(query.id)}
            onCopy={() => onCopy(query.sql)}
            onAskDelete={() => setConfirmingId(query.id)}
            onCancelDelete={() => setConfirmingId(null)}
            onConfirmDelete={() => void confirmDelete(query.id)}
          />
        ))}
      </tbody>
    </table>
  );
}
