import { useState } from 'react';
import { useClipboard } from '@/hooks/useClipboard';
import { useConnection } from '@/providers/ConnectionProvider';
import type { FabricItem } from '@/types/fabric';

export function ApiDetailsPanel({ item }: { item: FabricItem | null }) {
  const copy = useClipboard();
  const { activeConnection } = useConnection();
  const [open, setOpen] = useState(false);

  const workspaceId = activeConnection?.workspaceId ?? '{workspaceId}';
  const itemId = item?.id ?? '{itemId}';
  const path = `/v1/workspaces/${workspaceId}/items/${itemId}/jobs/instances`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2.5 bg-slate-50/70 hover:bg-slate-100/80 transition-colors flex items-center justify-between text-xs font-semibold text-slate-700"
      >
        <span className="flex items-center space-x-2">
          <i className="fa-solid fa-code text-indigo-500" />
          <span>Fabric API Context Details</span>
          <span className="font-mono text-[10px] text-slate-400 font-normal">GET /v1/workspaces/{'{workspaceId}'}/items/{'{itemId}'}/jobs/instances</span>
        </span>
        <i className={`fa-solid fa-chevron-down text-slate-400 text-[10px] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-4 border-t border-slate-200 bg-slate-900 text-slate-200 font-mono text-xs space-y-2">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-slate-400">HTTP Request Endpoint:</span>
            <button type="button" onClick={() => void copy(`GET ${path}`, 'API endpoint copied')} className="text-indigo-400 hover:underline">
              Copy Request
            </button>
          </div>
          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-teal-400 break-all">
            {`GET https://api.fabric.microsoft.com${path}`}
          </div>
        </div>
      )}
    </div>
  );
}
