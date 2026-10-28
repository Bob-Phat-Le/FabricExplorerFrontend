import { useCallback, useState } from 'react';
import * as discoveryApi from '@/lib/api/discovery.api';
import { CHECKING } from '@/lib/api/stream';
import { EMPTY, formatDateTime } from '@/lib/format';
import { BUSY_CLASS, useBusy } from '@/hooks/useBusy';
import { useClipboard } from '@/hooks/useClipboard';
import { useToast } from '@/providers/ToastProvider';
import type { Warehouse, WarehouseDetails, WarehouseStatusPatch } from '@/types/discovery';
import { MASK, ONLINE_STATUS_TONE } from '../constants';
import { useDiscoveryContext } from '../hooks/useDiscoveryContext';
import { useRequestGuard } from '../hooks/useRequestGuard';
import { useResourceList, type ResourceConfig } from '../hooks/useResourceList';
import { ResourceSelect } from './ResourceSelect';
import { StatusBadge } from './StatusBadge';

const CONFIG: ResourceConfig<Warehouse> = {
  noun: 'warehouse',
  fetch: discoveryApi.listWarehouses,
  idOf: (i) => i.warehouseId,
  nameOf: (i) => i.warehouseName,
};

export function WarehousePanel({ active }: { active: boolean }) {
  const { showApiError } = useToast();
  const copy = useClipboard();
  const { requireContext } = useDiscoveryContext();
  const { latest, invalidate, followStream } = useRequestGuard();
  const { isBusy, withBusy } = useBusy();

  const [warehouse, setWarehouse] = useState<WarehouseDetails | null>(null);
  const [connString, setConnString] = useState<string | null>(null); // null = thẻ chưa hiện
  const [revealed, setRevealed] = useState(false);

  const resetResults = useCallback(() => {
    invalidate('warehouse', 'connString');
    setWarehouse(null);
    setConnString(null);
    setRevealed(false);
  }, [invalidate]);

  const list = useResourceList(CONFIG, active, resetResults);

  const getWarehouse = async () => {
    const ctx = requireContext();
    const item = ctx && list.getSelected();
    if (!ctx || !item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, warehouseId: item.warehouseId };

    const isCurrent = latest('warehouse');
    await withBusy('getWarehouse', async () => {
      try {
        const live = await discoveryApi.getWarehouse({ ...target, signal: isCurrent.signal });
        if (!isCurrent()) return;
        setWarehouse(live.data);

        // Probe SQL có thể chậm: onlineStatus = "Checking" cho tới khi sự kiện online-status đến
        followStream(
          'warehouse',
          live,
          { 'online-status': (patch: WarehouseStatusPatch) => setWarehouse((w) => (w ? { ...w, ...patch } : w)) },
          () =>
            setWarehouse((w) =>
              w && w.onlineStatus === CHECKING
                ? { ...w, onlineStatus: 'Unknown', onlineStatusMessage: 'Could not determine the online status.' }
                : w,
            ),
        );
      } catch (err) {
        if (isCurrent()) showApiError(err, 'Could not load warehouse');
      }
    });
  };

  const getConnString = async () => {
    const ctx = requireContext();
    const item = ctx && list.getSelected();
    if (!ctx || !item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, warehouseId: item.warehouseId };

    const isCurrent = latest('connString');
    await withBusy('getConnString', async () => {
      try {
        const result = await discoveryApi.getWarehouseConnectionString({ ...target, signal: isCurrent.signal });
        if (!isCurrent()) return;
        setConnString(result?.connectionString ?? '');
        setRevealed(false);
      } catch (err) {
        if (isCurrent()) showApiError(err, 'Could not load connection string');
      }
    });
  };

  const opButton = (id: string, onClick: () => void, icon: string, title: string, text: string) => (
    <button
      type="button"
      disabled={isBusy(id)}
      onClick={onClick}
      className={`p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 text-left space-y-1.5 transition-all ${isBusy(id) ? BUSY_CLASS : ''}`}
    >
      <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs">
        <i className={`fa-solid ${icon}`} />
        <span>{title}</span>
      </div>
      <p className="text-[11px] text-slate-500">{text}</p>
    </button>
  );

  return (
    <div className={`${active ? '' : 'hidden'} space-y-6`}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <ResourceSelect id="warehouseSelect" label="Warehouse" list={list} onSelectionChange={resetResults} />

        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Operations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opButton('getWarehouse', () => void getWarehouse(), 'fa-circle-info', 'Get Warehouse', 'Retrieve information about the selected warehouse.')}
            {opButton('getConnString', () => void getConnString(), 'fa-key', 'Get Connection String', 'Retrieve connection info for selected warehouse.')}
          </div>
        </div>
      </div>

      {/* Warehouse Details Panel */}
      {warehouse && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Warehouse Details</h3>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="font-bold text-slate-800">{warehouse.name ?? EMPTY}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Status</dt>
              <dd className="font-bold">
                <StatusBadge
                  label={warehouse.onlineStatus ?? 'Unknown'}
                  tone={ONLINE_STATUS_TONE[warehouse.onlineStatus] ?? 'muted'}
                  title={warehouse.onlineStatusMessage ?? ''}
                />
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Workspace</dt>
              <dd className="font-medium text-slate-800">{warehouse.workspace?.name ?? EMPTY}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Workspace ID</dt>
              <dd className="font-mono text-slate-700 break-all">{warehouse.workspace?.id ?? EMPTY}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Created</dt>
              <dd className="text-slate-700">{formatDateTime(warehouse.createdDate)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Last Updated</dt>
              <dd className="text-slate-700">{formatDateTime(warehouse.lastUpdatedTime)}</dd>
            </div>
          </dl>
          {warehouse.onlineStatusMessage && <p className="text-[11px] text-slate-500">{warehouse.onlineStatusMessage}</p>}
        </div>
      )}

      {/* Warehouse Connection String Card */}
      {connString !== null && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Connection String</h3>
          <div className="p-3 bg-slate-900 rounded-xl text-slate-200 font-mono text-xs flex items-center justify-between">
            <span>{revealed ? connString : MASK}</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded text-slate-300"
              >
                {revealed ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={() => connString && void copy(connString, 'Connection string copied')}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs rounded text-white font-semibold"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
