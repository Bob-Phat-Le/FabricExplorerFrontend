'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useClipboard } from '@/hooks/useClipboard';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import type { CatalogTablesState } from '../hooks/useCatalogTables';
import { PanelMessage, SECONDARY_BUTTON } from './PanelMessage';

const CARD = 'bg-white rounded-xl border border-slate-200 shadow-sm p-4';

/** Lakehouse picker: the item whose tables are shown below. */
export function CatalogItemBar({ state }: { state: CatalogTablesState }) {
  const { hasConnection, lakehouseState, lakehouseError, lakehouses, selectedLakehouse, selectLakehouse, reloadLakehouses } = state;
  const copy = useClipboard();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  if (!hasConnection) {
    return (
      <div className={CARD}>
        <PanelMessage
          fill
          icon="fa-plug"
          title="No active connection"
          action={
            <Link href="/connection" className={SECONDARY_BUTTON}>
              <i className="fa-solid fa-plug text-indigo-600" />
              <span>Open Connection</span>
            </Link>
          }
        >
          Set an active connection to browse the tables of a lakehouse.
        </PanelMessage>
      </div>
    );
  }

  if (lakehouseState === 'error') {
    return (
      <div className={CARD}>
        <PanelMessage
          fill
          tone="error"
          icon="fa-triangle-exclamation"
          title="Could not load lakehouses"
          action={
            <button type="button" onClick={() => void reloadLakehouses()} className={SECONDARY_BUTTON}>
              <i className="fa-solid fa-rotate-right text-slate-400" />
              <span>Try again</span>
            </button>
          }
        >
          {lakehouseError}
        </PanelMessage>
      </div>
    );
  }

  if (lakehouseState === 'ready' && !selectedLakehouse) {
    return (
      <div className={CARD}>
        <PanelMessage fill icon="fa-cubes" title="No lakehouse in this workspace">
          Tables are read from a lakehouse. Create one in Microsoft Fabric, then reload.
        </PanelMessage>
      </div>
    );
  }

  if (!selectedLakehouse) {
    return (
      <div className={cn(CARD, 'flex items-center space-x-3.5')}>
        <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
        <div className="space-y-2">
          <div>
            <Skeleton width="w-48" />
          </div>
          <div>
            <Skeleton width="w-72" />
          </div>
        </div>
      </div>
    );
  }

  const term = search.trim().toLowerCase();
  const filtered = term
    ? lakehouses.filter((l) => l.lakehouseName.toLowerCase().includes(term) || l.lakehouseId.toLowerCase().includes(term))
    : lakehouses;

  return (
    <div className={cn(CARD, 'flex flex-col sm:flex-row sm:items-center justify-between gap-4')}>
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-md shrink-0">
          <i className="fa-solid fa-building-columns" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-sm truncate">{selectedLakehouse.lakehouseName}</h3>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              Lakehouse
            </span>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
            <span>
              Workspace: <strong className="text-slate-800">{selectedLakehouse.workspaceName ?? '—'}</strong>
            </span>
            <span aria-hidden>•</span>
            <span className="flex items-center space-x-1.5">
              <span>Item ID:</span>
              <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{selectedLakehouse.lakehouseId}</code>
              <button
                type="button"
                onClick={() => void copy(selectedLakehouse.lakehouseId, 'Item ID copied')}
                className="text-slate-400 hover:text-indigo-600"
                title="Copy Item ID"
                aria-label="Copy Item ID"
              >
                <i className="fa-regular fa-copy text-xs" />
              </button>
            </span>
          </div>
        </div>
      </div>

      <div ref={rootRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1.5"
        >
          <i className="fa-solid fa-arrow-right-arrow-left text-slate-400" />
          <span>Change Item</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-3rem)] bg-white rounded-xl border border-slate-200 shadow-2xl z-30 p-3 text-left space-y-2">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lakehouses by name or ID..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div role="listbox" className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {filtered.length === 0 ? (
                <p className="py-4 text-center text-xs text-slate-400">No lakehouse matches your search.</p>
              ) : (
                filtered.map((l) => {
                  const active = l.lakehouseId === selectedLakehouse.lakehouseId;
                  return (
                    <button
                      key={l.lakehouseId}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        selectLakehouse(l.lakehouseId);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors border',
                        active ? 'bg-indigo-50 border-indigo-200' : 'border-transparent hover:bg-slate-100 hover:border-slate-200',
                      )}
                    >
                      <span className="flex items-center space-x-2.5 min-w-0">
                        <i className="fa-solid fa-building-columns text-indigo-600 text-xs shrink-0" />
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-800 text-xs truncate">{l.lakehouseName}</span>
                          <span className="block text-[10px] text-slate-400 truncate">{l.workspaceName ?? 'Workspace'} · Lakehouse</span>
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
    </div>
  );
}
