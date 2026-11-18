import { useEffect, useState } from 'react';
import { Modal, ModalCloseButton } from '@/components/ui/Modal';
import * as discoveryApi from '@/lib/api/discovery.api';
import { cn } from '@/lib/cn';
import { useConnection } from '@/providers/ConnectionProvider';
import type { ConfigureLandingZonePayload } from '@/types/landingZone';
import type { MirroredDatabaseSummary } from '@/types/discovery';

type Mode = 'mirrored' | 'uri';

const INPUT = 'w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none';

interface Props {
  currentUri: string | null;
  working: boolean;
  onSubmit: (payload: ConfigureLandingZonePayload) => Promise<boolean>;
  onClose: () => void;
}

export function ConfigureDialog({ currentUri, working, onSubmit, onClose }: Props) {
  const { activeConnection } = useConnection();
  const [mode, setMode] = useState<Mode>('mirrored');
  const [databases, setDatabases] = useState<MirroredDatabaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [databaseId, setDatabaseId] = useState('');
  const [uri, setUri] = useState(currentUri ?? '');

  const connectionId = activeConnection?.id;
  const workspaceId = activeConnection?.workspaceId;

  useEffect(() => {
    if (!connectionId || !workspaceId) return;
    const ctrl = new AbortController();
    discoveryApi
      .listMirroredDatabases({ connectionId, workspaceId, signal: ctrl.signal })
      .then((list) => {
        setDatabases(list ?? []);
        setDatabaseId((list ?? [])[0]?.mirroredDatabaseId ?? '');
      })
      .catch((err: unknown) => {
        if (!ctrl.signal.aborted) setLoadError(err instanceof Error ? err.message : 'Could not load mirrored databases');
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [connectionId, workspaceId]);

  const valid = mode === 'mirrored' ? databaseId !== '' : uri.trim() !== '';

  const submit = async () => {
    const payload: ConfigureLandingZonePayload = mode === 'mirrored' ? { mirroredDatabaseId: databaseId } : { storageUri: uri.trim() };
    if (await onSubmit(payload)) onClose();
  };

  return (
    <Modal maxWidth="max-w-lg">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <h3 className="text-base font-bold text-slate-900">Configure Landing Zone</h3>
        <ModalCloseButton onClick={onClose} />
      </div>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
        {(['mirrored', 'uri'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn('px-3 py-1.5 rounded-lg font-semibold transition-colors', mode === m ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-800')}
          >
            {m === 'mirrored' ? 'Mirrored database (OneLake)' : 'Storage URI'}
          </button>
        ))}
      </div>

      {mode === 'mirrored' ? (
        <div className="space-y-2 text-xs">
          <label className="block font-semibold text-slate-800">Mirrored database</label>
          {loading ? (
            <p className="text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading mirrored databases…</p>
          ) : loadError ? (
            <p className="text-rose-600">{loadError}</p>
          ) : databases.length === 0 ? (
            <p className="text-slate-500">No mirrored database was found in this workspace. Use a storage URI instead.</p>
          ) : (
            <select value={databaseId} onChange={(e) => setDatabaseId(e.target.value)} className={INPUT}>
              {databases.map((d) => (
                <option key={d.mirroredDatabaseId} value={d.mirroredDatabaseId}>{d.mirroredDatabaseName}</option>
              ))}
            </select>
          )}
          <p className="text-[11px] text-slate-400">Uses the Open Mirroring landing zone <span className="font-mono">Files/LandingZone</span> of the selected database in the workspace of the active connection.</p>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <label className="block font-semibold text-slate-800">Storage URI</label>
          <input value={uri} onChange={(e) => setUri(e.target.value)} placeholder="abfss://landing-zone@account.dfs.core.windows.net/folder" className={cn(INPUT, 'font-mono')} />
          <p className="text-[11px] text-slate-400">
            <span className="font-mono">abfss://&lt;container&gt;@&lt;host&gt;/&lt;folder&gt;</span> or{' '}
            <span className="font-mono">https://&lt;host&gt;/&lt;workspace&gt;/&lt;item&gt;/Files/LandingZone</span>. Hosts ending in{' '}
            <span className="font-mono">.dfs.fabric.microsoft.com</span> and <span className="font-mono">.dfs.core.windows.net</span> are supported. The service principal of the connection needs access to it.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Cancel</button>
        <button type="button" disabled={!valid || working} onClick={() => void submit()} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold">
          {working ? 'Checking access…' : 'Save'}
        </button>
      </div>
    </Modal>
  );
}
