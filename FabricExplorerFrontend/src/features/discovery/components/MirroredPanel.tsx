import { useCallback, useState } from 'react';
import * as discoveryApi from '@/lib/api/discovery.api';
import { sleep } from '@/lib/api/client';
import { CHECKING } from '@/lib/api/stream';
import { EMPTY, formatDateTime, formatNumber, formatSeconds, timeAgo } from '@/lib/format';
import { BUSY_CLASS, useBusy } from '@/hooks/useBusy';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/providers/ToastProvider';
import type {
  MirroredDatabaseDetails,
  MirroredDatabaseSummary,
  MirroringMetricsPatch,
  MirroringStatus,
  MirroringStatusPatch,
  SourceInfoPatch,
  TableMirroringStatus,
} from '@/types/discovery';
import { DB_STATUS_TONE, MIRRORING_STATUS_TONE, STATUS_POLL_MAX, STATUS_POLL_MS, TABLE_MIRRORING_TONE } from '../constants';
import { useDiscoveryContext } from '../hooks/useDiscoveryContext';
import { useRequestGuard } from '../hooks/useRequestGuard';
import { useResourceList, type ResourceConfig } from '../hooks/useResourceList';
import { ResourceSelect } from './ResourceSelect';
import { StatusBadge } from './StatusBadge';

const CONFIG: ResourceConfig<MirroredDatabaseSummary> = {
  noun: 'mirrored database',
  fetch: discoveryApi.listMirroredDatabases,
  idOf: (i) => i.mirroredDatabaseId,
  nameOf: (i) => i.mirroredDatabaseName,
};

interface StatusView {
  data: MirroringStatus;
  pending: string[];
}

interface Target {
  connectionId: string;
  workspaceId: string;
  mirroredDatabaseId: string;
}

const btn = 'px-3.5 py-2 border rounded-lg text-xs font-semibold';

export function MirroredPanel({ active }: { active: boolean }) {
  const { showToast, showApiError } = useToast();
  const { requireContext } = useDiscoveryContext();
  const { latest, invalidate, followStream } = useRequestGuard();
  const { isBusy, withBusy } = useBusy();

  const [db, setDb] = useState<MirroredDatabaseDetails | null>(null);
  const [status, setStatus] = useState<StatusView | null>(null);
  const [tableRows, setTableRows] = useState<TableMirroringStatus[] | null>(null);

  const resetResults = useCallback(() => {
    invalidate('mirroredDb', 'mirroringStatus', 'tablesStatus', 'mirrorAction', 'statusFollow');
    setDb(null);
    setStatus(null);
    setTableRows(null);
  }, [invalidate]);

  const list = useResourceList(CONFIG, active, resetResults);

  const target = (): Target | null => {
    const ctx = requireContext();
    const item = ctx && list.getSelected();
    if (!ctx || !item) return null;
    return { ...ctx, workspaceId: item.workspaceId, mirroredDatabaseId: item.mirroredDatabaseId };
  };

  // ---- Mirrored DB ----
  const getMirroredDb = async () => {
    const t = target();
    if (!t) return;

    const isCurrent = latest('mirroredDb');
    await withBusy('getDb', async () => {
      try {
        const live = await discoveryApi.getMirroredDb({ ...t, signal: isCurrent.signal });
        if (!isCurrent()) return;
        setDb(live.data);

        followStream(
          'mirroredDb',
          live,
          {
            'mirroring-status': (patch: MirroringStatusPatch) => setDb((d) => (d ? { ...d, ...patch } : d)),
            'source-info': (patch: SourceInfoPatch) => setDb((d) => (d ? { ...d, ...patch } : d)),
          },
          () =>
            setDb((d) => {
              if (!d) return d;
              const next = { ...d };
              if (d.status === CHECKING || d.mirroringStatus === CHECKING) {
                next.status = 'Unknown';
                next.mirroringStatus = 'Unknown';
              }
              if (d.sourceName === CHECKING || d.sourceType === CHECKING) {
                next.sourceName = null;
                next.sourceType = null;
              }
              return next;
            }),
        );
      } catch (err) {
        if (isCurrent()) showApiError(err, 'Could not load mirrored database');
      }
    });
  };

  // ---- Mirroring status ----
  const trackMirroringStatus = (key: string, live: Awaited<ReturnType<typeof discoveryApi.getMirroringStatus>>) => {
    setStatus({ data: live.data, pending: live.isStreaming ? live.pendingFields : [] });

    followStream(
      key,
      live,
      {
        'mirroring-metrics': (patch: MirroringMetricsPatch) =>
          setStatus((s) => (s ? { data: { ...s.data, ...patch }, pending: s.pending.filter((f) => !(f in patch)) } : s)),
      },
      () =>
        setStatus((s) => {
          if (!s || !s.pending.length) return s;
          const nulls = Object.fromEntries(s.pending.map((f) => [f, null]));
          return { data: { ...s.data, ...nulls }, pending: [] };
        }),
    );
  };

  const getMirroringStatus = async () => {
    const t = target();
    if (!t) return;

    const isCurrent = latest('mirroringStatus');
    await withBusy('getStatus', async () => {
      try {
        const live = await discoveryApi.getMirroringStatus({ ...t, signal: isCurrent.signal });
        if (isCurrent()) trackMirroringStatus('mirroringStatus', live);
      } catch (err) {
        if (isCurrent()) showApiError(err, 'Could not load mirroring status');
      }
    });
  };

  const followMirroringStatus = async (t: Target, goals: string[]) => {
    const isCurrent = latest('statusFollow');
    for (let i = 0; i < STATUS_POLL_MAX; i++) {
      await sleep(STATUS_POLL_MS);
      if (!isCurrent()) return;
      try {
        const live = await discoveryApi.getMirroringStatus({ ...t, signal: isCurrent.signal });
        if (!isCurrent()) return;
        trackMirroringStatus('statusFollow', live);
        if (goals.includes(live.data.status)) return;
      } catch (err) {
        console.warn('Mirroring status poll failed', err);
      }
    }
  };

  const changeMirroring = async (action: 'start' | 'stop') => {
    const t = target();
    if (!t) return;

    const isStart = action === 'start';
    const isCurrent = latest('mirrorAction');
    await withBusy(['start', 'stop'], async () => {
      try {
        const api = isStart ? discoveryApi.startMirroring : discoveryApi.stopMirroring;
        const result = await api(t);
        if (!isCurrent()) return;
        showToast(result?.message || (isStart ? 'Mirroring process started' : 'Mirroring process stopped'), isStart ? 'success' : 'warning');
      } catch (err) {
        if (isCurrent()) showApiError(err, isStart ? 'Could not start mirroring' : 'Could not stop mirroring');
        return;
      }
      void followMirroringStatus(t, isStart ? ['Running'] : ['Stopped']);
    });
  };

  const stopMirroring = () => {
    if (list.selectedId && !window.confirm(`Stop mirroring for "${list.selectedLabel}"?`)) return;
    void changeMirroring('stop');
  };

  // ---- Tables status ----
  const getTablesStatus = async () => {
    const t = target();
    if (!t) return;

    const isCurrent = latest('tablesStatus');
    await withBusy('tables', async () => {
      try {
        const rows = (await discoveryApi.getTablesMirroringStatus({ ...t, signal: isCurrent.signal })) ?? [];
        if (!isCurrent()) return;
        setTableRows(rows);
      } catch (err) {
        if (isCurrent()) showApiError(err, 'Could not load table mirroring status');
      }
    });
  };

  const pending = (field: string) => status?.pending.includes(field) ?? false;
  const mirroringChecking = db?.mirroringStatus === CHECKING;
  const sourceChecking = db?.sourceName === CHECKING || db?.sourceType === CHECKING;

  const opButton = (id: string, label: string, onClick: () => void, color: string) => (
    <button
      type="button"
      disabled={isBusy(id)}
      onClick={onClick}
      className={`${btn} ${color} ${isBusy(id) ? BUSY_CLASS : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className={`${active ? '' : 'hidden'} space-y-6`}>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <ResourceSelect id="mirroredSelect" label="Mirrored Database" list={list} onSelectionChange={resetResults} />

        <div className="pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Operations</h3>
          <div className="flex flex-wrap gap-2">
            {opButton('getDb', 'Get Mirrored DB', () => void getMirroredDb(), 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50')}
            {opButton('getStatus', 'Get Status', () => void getMirroringStatus(), 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50')}
            {opButton('start', 'Start Mirroring', () => void changeMirroring('start'), 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100')}
            {opButton('stop', 'Stop Mirroring', stopMirroring, 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100')}
            {opButton('tables', 'Tables Status', () => void getTablesStatus(), 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100')}
          </div>
        </div>
      </div>

      {/* Mirrored DB Details Card */}
      {db && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">Database Details</h3>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <dt className="text-slate-400">Name</dt>
              <dd className="font-bold text-slate-900">{db.mirroredDatabaseName ?? EMPTY}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Workspace</dt>
              <dd className="font-medium text-slate-700">{db.workspaceName ?? EMPTY}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Status</dt>
              <dd className="font-bold">
                <StatusBadge
                  label={db.status ?? 'Unknown'}
                  tone={DB_STATUS_TONE[db.status] ?? 'muted'}
                  title={`Mirroring status: ${db.mirroringStatus ?? 'Unknown'}`}
                />
                {!mirroringChecking && <span className="ml-1.5 text-[11px] font-normal text-slate-400">{db.mirroringStatus ?? ''}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Source</dt>
              <dd className="font-mono text-slate-700">
                {sourceChecking ? (
                  <Skeleton width="w-32" />
                ) : (
                  [db.sourceName, db.sourceType && db.sourceType !== db.sourceName ? `(${db.sourceType})` : ''].filter(Boolean).join(' ') || EMPTY
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Created</dt>
              <dd className="text-slate-700" title="Fabric does not expose the creation date of mirrored databases">
                {db.createdAt ? formatDateTime(db.createdAt) : 'Not available'}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Mirroring Status Card */}
      {status && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mirroring Status</h3>
            <StatusBadge label={status.data.status ?? 'Unknown'} tone={MIRRORING_STATUS_TONE[status.data.status] ?? 'muted'} />
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div>
              <dt className="text-slate-400">Last Synchronization</dt>
              <dd
                className="font-semibold text-slate-800"
                title={pending('lastSynchronization') ? undefined : formatDateTime(status.data.lastSynchronization)}
              >
                {pending('lastSynchronization') ? (
                  <Skeleton width="w-16" />
                ) : status.data.lastSynchronization ? (
                  timeAgo(status.data.lastSynchronization)
                ) : (
                  EMPTY
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Records Synchronized</dt>
              <dd className="font-mono font-bold text-slate-900">
                {pending('recordSynchronized') ? <Skeleton width="w-16" /> : formatNumber(status.data.recordSynchronized)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-400">Current Latency</dt>
              <dd className="font-semibold text-slate-800">
                {pending('currentLatency') ? <Skeleton width="w-10" /> : formatSeconds(status.data.currentLatency)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Tables Mirroring Grid Card */}
      {tableRows && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Tables Mirroring Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-3 pl-4">Table</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Sync</th>
                  <th className="p-3">Lag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No tables are being mirrored.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((r) => (
                    <tr key={r.tableName}>
                      <td className="p-3 pl-4 font-bold text-slate-900">{r.tableName}</td>
                      <td className="p-3 font-mono">{r.source}</td>
                      <td className="p-3 font-mono">{r.target}</td>
                      <td className="p-3">
                        <StatusBadge label={r.status ?? 'Unknown'} tone={TABLE_MIRRORING_TONE[r.status] ?? 'muted'} />
                      </td>
                      <td className="p-3 text-slate-500" title={formatDateTime(r.lastSync)}>
                        {timeAgo(r.lastSync)}
                      </td>
                      <td className="p-3 font-mono">{formatSeconds(r.lag)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
