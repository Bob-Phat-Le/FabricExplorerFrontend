'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pagination } from '@/features/connection/components/Pagination';
import * as configurationApi from '@/lib/api/configuration.api';
import { BUSY_CLASS } from '@/hooks/useBusy';
import { useToast } from '@/providers/ToastProvider';
import type { ConfigurationCapabilities, ConfigurationHistoryItem, ExportScope } from '@/types/configuration';
import { ExportModal } from './components/ExportModal';
import { HistoryPanel } from './components/HistoryPanel';
import { ImportWizard } from './components/ImportWizard';
import { InventoryTable } from './components/InventoryTable';
import { FALLBACK_CAPABILITIES, PAGE_SIZE_OPTIONS, STATUS_FILTERS, TYPE_FILTERS } from './constants';
import { useInventory } from './hooks/useInventory';

const SELECT =
  'text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500/30 outline-none cursor-pointer';

export function ImportExportView() {
  const { showToast } = useToast();
  const inv = useInventory();

  const [caps, setCaps] = useState<ConfigurationCapabilities>(FALLBACK_CAPABILITIES);
  const [history, setHistory] = useState<ConfigurationHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [exportScope, setExportScope] = useState<ExportScope | null>(null);
  const [importing, setImporting] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      setHistory(await configurationApi.getHistory(8));
    } catch {
      // The activity list is optional: the page works without it.
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    configurationApi
      .getCapabilities()
      .then((c) => !cancelled && setCaps(c))
      .catch(() => showToast('Could not load import limits, using defaults', 'warning'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const { reload, clearSelection } = inv;

  const handleImported = useCallback(() => {
    clearSelection();
    void reload();
    void loadHistory();
  }, [clearSelection, reload, loadHistory]);

  const selectedCount = inv.selected.size;
  const { paging } = inv;
  const pageFullySelected = inv.items.length > 0 && inv.pageSelectedCount === inv.items.length;
  const canSelectAllMatching = pageFullySelected && paging.totalItems > inv.items.length && selectedCount < paging.totalItems;

  return (
    <section className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import &amp; Export</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <i className="fa-solid fa-sliders mr-1 text-[9px]" />
              Configuration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Back up, transfer and restore your Fabric Explorer connections and saved queries.</p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setImporting(true)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2"
          >
            <i className="fa-solid fa-file-import text-indigo-600" />
            <span>Import Configuration</span>
          </button>
          <button
            type="button"
            onClick={() => setExportScope('all')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2"
          >
            <i className="fa-solid fa-file-export" />
            <span>Export Configuration</span>
          </button>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs" />
              <input
                type="text"
                value={inv.filters.search}
                onChange={(e) => inv.patchFilters({ search: e.target.value })}
                placeholder="Search by name, source or connection..."
                aria-label="Search configurations"
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/30 outline-none"
              />
            </div>
            <select aria-label="Filter by type" value={inv.filters.type} onChange={(e) => inv.patchFilters({ type: e.target.value })} className={SELECT}>
              {TYPE_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select aria-label="Filter by status" value={inv.filters.status} onChange={(e) => inv.patchFilters({ status: e.target.value })} className={SELECT}>
              {STATUS_FILTERS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-slate-500 font-medium">Total</span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
              {paging.totalItems} item{paging.totalItems === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              title="Refresh"
              disabled={inv.loading}
              onClick={() => void inv.reload()}
              className={`px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${inv.loading ? BUSY_CLASS : ''}`}
            >
              <i className={`fa-solid fa-rotate-right text-slate-400 ${inv.loading ? 'fa-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <InventoryTable
          items={inv.items}
          loading={inv.loading}
          selected={inv.selected}
          pageSelectedCount={inv.pageSelectedCount}
          onToggle={inv.toggle}
          onTogglePage={inv.togglePage}
        />

        {/* Selection footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
            <span>
              {selectedCount} of {paging.totalItems} configuration{paging.totalItems === 1 ? '' : 's'} selected
            </span>
            {canSelectAllMatching && (
              <button type="button" disabled={inv.selectingAll} onClick={() => void inv.selectAllMatching()} className="text-indigo-600 font-bold hover:underline disabled:opacity-60">
                {inv.selectingAll ? 'Selecting…' : `Select all ${paging.totalItems} matching`}
              </button>
            )}
            {selectedCount > 0 && (
              <button type="button" onClick={inv.clearSelection} className="text-slate-500 hover:underline">
                Clear selection
              </button>
            )}
          </div>
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={() => setExportScope('selected')}
            className="text-indigo-600 font-bold hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed text-left"
          >
            Export selected items
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <label className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Rows per page</span>
            <select value={paging.pageSize} onChange={(e) => inv.setPageSize(Number(e.target.value))} className="text-xs px-2 py-1 rounded-lg border border-slate-300 bg-white">
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex-1 w-full sm:w-auto">
            <Pagination
              page={paging.page}
              pageSize={paging.pageSize}
              total={paging.totalItems}
              totalPages={paging.totalPages}
              count={inv.items.length}
              onChange={inv.goToPage}
            />
          </div>
        </div>
      </div>

      <HistoryPanel items={history} loading={historyLoading} />

      {exportScope && (
        <ExportModal initialScope={exportScope} selected={inv.selected} totalItems={paging.totalItems} onClose={() => setExportScope(null)} />
      )}
      {importing && <ImportWizard caps={caps} onClose={() => setImporting(false)} onImported={handleImported} />}
    </section>
  );
}
