'use client';

import { useRouter } from 'next/navigation';
import { useClipboard } from '@/hooks/useClipboard';
import { EMPTY } from '@/lib/format';
import { buildSampleQuery } from '../../shared/sql';
import { saveQuerySample } from '../../shared/querySampleStore';
import type { CatalogTablesState } from '../hooks/useCatalogTables';
import { PanelMessage, SECONDARY_BUTTON } from './PanelMessage';

function ColumnsSkeleton() {
  return (
    <tbody className="divide-y divide-slate-100" aria-label="Loading columns">
      {Array.from({ length: 6 }, (_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="p-2.5 pl-4"><div className="h-3 w-5 rounded bg-slate-100" /></td>
          <td className="p-2.5"><div className="h-3 w-28 rounded bg-slate-200" /></td>
          <td className="p-2.5"><div className="h-3 w-20 rounded bg-slate-100" /></td>
          <td className="p-2.5"><div className="h-3 w-8 rounded bg-slate-100" /></td>
          <td className="p-2.5 pr-4"><div className="h-3 w-48 rounded bg-slate-100" /></td>
        </tr>
      ))}
    </tbody>
  );
}

/** Right column: structure of the selected table. */
export function TableDetailPanel({ state }: { state: CatalogTablesState }) {
  const router = useRouter();
  const copy = useClipboard();
  const { selected, selectedDetail: detail, detailState, detailError, reloadDetail, selectedLakehouse } = state;

  if (!selected) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 h-full overflow-hidden p-5">
        <PanelMessage fill icon="fa-table-list" title="Select a Table">
          Choose a table from the browser on the left to view its columns, types and descriptions.
        </PanelMessage>
      </div>
    );
  }

  const fullName = `${selected.schema}.${selected.table}`;
  const columns = detail?.columns ?? [];
  const loading = detailState === 'loading' && !detail;
  const hasDescriptions = columns.some((c) => c.description);

  const loadSample = () => {
    if (!detail) return;
    saveQuerySample({ sql: buildSampleQuery(detail.schema, detail.name, detail.columns), label: fullName });
    router.push('/catalog/query-editor');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 h-full overflow-hidden p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h2 className="font-bold text-slate-900 text-base truncate" title={fullName}>
              {fullName}
            </h2>
            <button
              type="button"
              onClick={() => void copy(fullName, 'Table name copied')}
              className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-white/80 transition-all"
              title="Copy Full Table Name"
              aria-label="Copy full table name"
            >
              <i className="fa-regular fa-copy text-xs" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical Fabric {detail?.format ? detail.format.toUpperCase() : 'Delta'} storage entity
            {selectedLakehouse && <> · {selectedLakehouse.lakehouseName}</>}
          </p>
          {detail?.description && <p className="text-xs text-slate-600 mt-2 max-w-prose break-words">{detail.description}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={loadSample}
            disabled={!detail}
            className={`${SECONDARY_BUTTON} disabled:opacity-60 disabled:cursor-not-allowed`}
            title="Load Query Sample into Query Editor"
          >
            <i className="fa-solid fa-code text-indigo-600" />
            <span>Load Query Sample to Query Editor</span>
          </button>
        </div>
      </div>

      {detailState === 'error' && !detail ? (
        <PanelMessage
          fill
          tone="error"
          icon="fa-triangle-exclamation"
          title="Could not load columns"
          action={
            <button type="button" onClick={() => void reloadDetail()} className={SECONDARY_BUTTON}>
              <i className="fa-solid fa-rotate-right text-slate-400" />
              <span>Try again</span>
            </button>
          }
        >
          {detailError}
        </PanelMessage>
      ) : (
        <div className="flex-1 min-h-0 border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold shrink-0">
            <span>Column Structure</span>
            <span>{loading ? 'Loading…' : `${columns.length} ${columns.length === 1 ? 'Column' : 'Columns'}`}</span>
          </div>
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-slate-400 font-medium border-b border-slate-200 text-[11px] sticky top-0 bg-slate-50 z-10">
                  <th className="p-2.5 pl-4 w-10">#</th>
                  <th className="p-2.5">Column</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Nullable</th>
                  <th className="p-2.5 pr-4">Description</th>
                </tr>
              </thead>
              {loading ? (
                <ColumnsSkeleton />
              ) : (
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {columns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        This table has no columns.
                      </td>
                    </tr>
                  ) : (
                    columns.map((c) => (
                      <tr key={c.name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 pl-4 font-mono text-slate-300">{c.position + 1}</td>
                        <td className="p-2.5 font-mono font-bold text-slate-900 break-all">{c.name}</td>
                        <td className="p-2.5 font-mono text-indigo-600 whitespace-nowrap">{c.type}</td>
                        <td className="p-2.5">
                          {c.nullable ? <span className="text-amber-600 font-semibold">Yes</span> : <span className="text-slate-500">No</span>}
                        </td>
                        <td className="p-2.5 pr-4 text-slate-500 font-normal break-words min-w-[12rem]">
                          {c.description ?? <span className="text-slate-300">{EMPTY}</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              )}
            </table>
          </div>
          {detail && !hasDescriptions && columns.length > 0 && (
            <p className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-400 shrink-0">
              No column descriptions are defined for this table in OneLake.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
