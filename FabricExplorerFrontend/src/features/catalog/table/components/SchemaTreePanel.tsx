'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import type { CatalogTableRef } from '@/types/catalog';
import type { CatalogTablesState } from '../hooks/useCatalogTables';
import { PanelMessage, SECONDARY_BUTTON } from './PanelMessage';

function TreeSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-label="Loading tables">
      {[4, 2].map((rows, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-slate-200" />
          <div className="pl-3 border-l-2 border-slate-100 space-y-1.5">
            {Array.from({ length: rows }, (_, r) => (
              <div key={r} className="h-7 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const isSame = (a: CatalogTableRef | null, schema: string, table: string) => a?.schema === schema && a.table === table;

/** Left column: tables grouped by schema, with search. */
export function SchemaTreePanel({ state }: { state: CatalogTablesState }) {
  const { tree, treeState, treeError, selected, selectTable, reloadTree, columnCountOf, selectedLakehouse } = state;

  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const term = search.trim().toLowerCase();

  // keep folder state per lakehouse
  const lakehouseId = selectedLakehouse?.lakehouseId;
  const [lastLakehouse, setLastLakehouse] = useState(lakehouseId);
  if (lastLakehouse !== lakehouseId) {
    setLastLakehouse(lakehouseId);
    setCollapsed({});
    setSearch('');
  }

  const groups = useMemo(() => {
    if (!tree) return [];
    return tree.schemas
      .map((schema) => {
        const schemaMatches = term !== '' && schema.name.toLowerCase().includes(term);
        const tables = term && !schemaMatches ? schema.tables.filter((t) => t.name.toLowerCase().includes(term)) : schema.tables;
        return { name: schema.name, tables, total: schema.tables.length };
      })
      .filter((g) => !term || g.tables.length > 0);
  }, [tree, term]);

  const visibleCount = groups.reduce((n, g) => n + g.tables.length, 0);
  const totalCount = tree?.totalTables ?? 0;
  const badge = treeState !== 'ready' ? '—' : term ? `${visibleCount} / ${totalCount}` : `${totalCount} ${totalCount === 1 ? 'Table' : 'Tables'}`;
  const busy = treeState === 'loading';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4 flex flex-col min-h-0 h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 shrink-0 gap-2">
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tables</h3>
          <p className="text-[10px] text-slate-400">Browse tables grouped by schema</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">{badge}</span>
          <button
            type="button"
            onClick={() => void reloadTree()}
            disabled={busy || !selectedLakehouse}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            title="Reload tables from Fabric"
            aria-label="Reload tables"
          >
            <i className={cn('fa-solid fa-rotate-right text-[11px]', busy && 'fa-spin')} />
          </button>
        </div>
      </div>

      <div className="relative shrink-0">
        <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tables..."
          disabled={treeState !== 'ready'}
          className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50"
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 text-xs pr-1">
        {treeState === 'error' ? (
          <PanelMessage
            tone="error"
            icon="fa-triangle-exclamation"
            title="Could not load tables"
            action={
              <button type="button" onClick={() => void reloadTree()} className={SECONDARY_BUTTON}>
                <i className="fa-solid fa-rotate-right text-slate-400" />
                <span>Try again</span>
              </button>
            }
          >
            {treeError}
          </PanelMessage>
        ) : treeState !== 'ready' ? (
          selectedLakehouse ? (
            <TreeSkeleton />
          ) : (
            <PanelMessage icon="fa-cubes" title="No lakehouse selected">
              Pick a lakehouse to list its tables.
            </PanelMessage>
          )
        ) : totalCount === 0 ? (
          <PanelMessage icon="fa-table" title="No tables">
            This lakehouse has no tables yet. Load data into it, then reload.
          </PanelMessage>
        ) : groups.length === 0 ? (
          <PanelMessage icon="fa-magnifying-glass" title="No matching tables">
            Nothing matches “{search.trim()}”.
          </PanelMessage>
        ) : (
          groups.map((group) => {
            // while searching, matching schemas are always expanded
            const isCollapsed = !term && collapsed[group.name] === true;
            return (
              <div key={group.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [group.name]: !isCollapsed }))}
                  aria-expanded={!isCollapsed}
                  className="w-full flex items-center justify-between font-bold text-slate-700 py-1 px-1 rounded hover:bg-slate-50"
                >
                  <span className="flex items-center space-x-1.5 min-w-0">
                    <i className={cn('fa-solid text-indigo-500 text-[11px] w-3.5', isCollapsed ? 'fa-folder' : 'fa-folder-open')} />
                    <span className="truncate">{group.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono font-normal shrink-0">
                    {term ? `${group.tables.length}/${group.total}` : group.total}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="pl-3 border-l-2 border-slate-100 space-y-0.5">
                    {group.tables.map((t) => {
                      const active = isSame(selected, group.name, t.name);
                      const cols = columnCountOf(t);
                      return (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => selectTable({ schema: group.name, table: t.name })}
                          aria-current={active ? 'true' : undefined}
                          title={`${group.name}.${t.name}`}
                          className={cn(
                            'w-full text-left px-2.5 py-1.5 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all',
                            active
                              ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-200'
                              : 'text-slate-600 hover:bg-slate-50 border-transparent',
                          )}
                        >
                          <span className="flex items-center space-x-2 min-w-0">
                            <i className={cn('fa-solid fa-table text-[11px]', active ? 'text-indigo-600' : 'text-slate-400')} />
                            <span className="truncate">{t.name}</span>
                          </span>
                          {cols !== null && (
                            <span className={cn('text-[10px] font-mono shrink-0', active ? 'text-indigo-500' : 'text-slate-400')}>
                              {cols} {cols === 1 ? 'col' : 'cols'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
