'use client';

import { useConnection } from '@/providers/ConnectionProvider';
import { CatalogItemBar } from './components/CatalogItemBar';
import { SchemaTreePanel } from './components/SchemaTreePanel';
import { TableDetailPanel } from './components/TableDetailPanel';
import { useCatalogTables } from './hooks/useCatalogTables';

export function TableView() {
  const { activeConnection } = useConnection();
  const state = useCatalogTables();

  return (
    <section id="view-catalog" className="max-w-7xl mx-auto flex flex-col gap-4 lg:h-full lg:min-h-[640px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 shrink-0">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Catalog</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <i className="fa-solid fa-book-bookmark mr-1 text-[9px]" />
              Tables Explorer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Browse Fabric tables and generate reusable schema definitions.</p>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md font-medium border border-slate-200">
              <strong className="text-slate-800">Connection:</strong> {activeConnection?.name ?? 'None'}
            </span>
            <span className="bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md font-medium border border-indigo-100">
              <strong className="text-indigo-900">Workspace:</strong> {activeConnection?.workspaceName ?? activeConnection?.workspaceId ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0">
        <CatalogItemBar state={state} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)] gap-6 lg:flex-1 lg:min-h-0">
        <div className="lg:col-span-4 h-[420px] lg:h-auto min-h-0">
          <SchemaTreePanel state={state} />
        </div>
        <div className="lg:col-span-8 h-[560px] lg:h-auto min-h-0">
          <TableDetailPanel state={state} />
        </div>
      </div>
    </section>
  );
}
