'use client';

import { useState } from 'react';
import type { JobInstance } from '@/types/fabric';
import { ApiDetailsPanel } from './components/ApiDetailsPanel';
import { CreateItemModal } from './components/CreateItemModal';
import { JobDetailsDrawer } from './components/JobDetailsDrawer';
import { JobStats } from './components/JobStats';
import { JobsTable } from './components/JobsTable';
import { MonitoredItemCard } from './components/MonitoredItemCard';
import { useJobInstances } from './hooks/useJobInstances';

export function JobInstancesView() {
  const { items, loadItems, activeItem, jobs, selectItem, addAndSelect, refresh, loadNextPage } = useJobInstances();
  const [creating, setCreating] = useState(false);
  const [inspected, setInspected] = useState<JobInstance | null>(null);
  const [autoRefresh, setAutoRefresh] = useState('30');

  const visibleJobs = activeItem ? jobs : [];

  return (
    <section className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Instances</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <i className="fa-solid fa-chart-line mr-1" />
              Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Monitor execution history and current job activity for a Microsoft Fabric item.</p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs shadow-sm">
            <span className="text-slate-600 font-medium text-[11px]">Auto-refresh:</span>
            <select
              value={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.value)}
              className="text-xs bg-transparent font-semibold text-indigo-600 outline-none"
            >
              <option value="0">Off</option>
              <option value="15">15s</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
              <option value="300">5m</option>
            </select>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>

          <button
            type="button"
            onClick={() => void refresh()}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm flex items-center space-x-2"
          >
            <i className="fa-solid fa-rotate-right text-slate-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <MonitoredItemCard
        item={activeItem}
        items={items}
        loadItems={loadItems}
        onSelect={(item) => void selectItem(item)}
        onCreate={() => setCreating(true)}
      />

      <ApiDetailsPanel item={activeItem} />
      <JobStats jobs={visibleJobs} />
      <JobsTable jobs={visibleJobs} onInspect={setInspected} onLoadNext={() => void loadNextPage()} />

      {creating && <CreateItemModal onClose={() => setCreating(false)} onUseItem={(item) => void addAndSelect(item)} />}
      {inspected && <JobDetailsDrawer job={inspected} onClose={() => setInspected(null)} />}
    </section>
  );
}
