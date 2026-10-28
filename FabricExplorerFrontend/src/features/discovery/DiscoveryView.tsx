'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { LakehousePanel } from './components/LakehousePanel';
import { MirroredPanel } from './components/MirroredPanel';
import { WarehousePanel } from './components/WarehousePanel';
import type { ResourceType } from './constants';

const RESOURCES: { type: ResourceType; title: string; description: string; icon: string }[] = [
  { type: 'lakehouse', title: 'Lakehouse', description: 'Explore tables and load data', icon: 'fa-building-columns' },
  { type: 'warehouse', title: 'Warehouse', description: 'Inspect warehouses & connection strings', icon: 'fa-warehouse' },
  { type: 'mirrored', title: 'Mirrored Database', description: 'Monitor and control database mirroring', icon: 'fa-arrows-rotate' },
];

export function DiscoveryView() {
  const [current, setCurrent] = useState<ResourceType>('lakehouse');

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Discovery</h1>
        <p className="text-xs text-slate-500 mt-0.5">Explore and inspect Microsoft Fabric resources.</p>
      </div>

      {/* Resource Type Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {RESOURCES.map((r) => {
          const on = r.type === current;
          return (
            <button
              key={r.type}
              type="button"
              onClick={() => setCurrent(r.type)}
              className={cn(
                'cursor-pointer rounded-xl p-4 transition-all shadow-sm group text-left',
                on ? 'border-2 border-indigo-600 bg-indigo-50/40' : 'border border-slate-200 bg-white hover:border-indigo-300',
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold',
                    on
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors',
                  )}
                >
                  <i className={`fa-solid ${r.icon}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{r.title}</h3>
                  <p className="text-[11px] text-slate-500">{r.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <LakehousePanel active={current === 'lakehouse'} />
      <WarehousePanel active={current === 'warehouse'} />
      <MirroredPanel active={current === 'mirrored'} />
    </section>
  );
}
