'use client';

import Link from 'next/link';
import { useState } from 'react';
import { timeAgo } from '@/lib/format';
import { useConnection } from '@/providers/ConnectionProvider';
import type { LandingZoneItem } from '@/types/landingZone';
import { ConfigureDialog } from './components/ConfigureDialog';
import { DeleteDialog, NewFolderDialog, RenameDialog, TransferDialog, UploadDialog } from './components/Dialogs';
import { FileBrowser } from './components/FileBrowser';
import { FileDrawer } from './components/FileDrawer';
import { FolderTree } from './components/FolderTree';
import { OperationsPanel } from './components/OperationsPanel';
import { useLandingZone } from './hooks/useLandingZone';

type Dialog =
  | { type: 'upload' }
  | { type: 'newFolder' }
  | { type: 'configure' }
  | { type: 'rename'; item: LandingZoneItem }
  | { type: 'delete'; items: LandingZoneItem[] }
  | { type: 'transfer'; mode: 'move' | 'copy'; items: LandingZoneItem[] };

export function LandingZoneView() {
  const { activeConnection } = useConnection();
  const state = useLandingZone();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [drawerItem, setDrawerItem] = useState<LandingZoneItem | null>(null);

  const configured = state.config?.isConfigured === true;
  const closeDialog = () => setDialog(null);

  return (
    <section className="space-y-5 max-w-7xl mx-auto">
      {/* header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Landing Zone Explorer</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <i className="fa-solid fa-folder-tree mr-1 text-[9px]" />
              Open Mirroring Storage
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Browse, organize, and manage files in your configured Landing Zone.</p>

          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
            <span className="bg-white text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200 flex items-center space-x-1.5">
              <i className="fa-solid fa-plug text-emerald-600 text-[10px]" />
              <span><strong className="text-slate-900">Connection:</strong> {activeConnection?.name ?? 'None'}</span>
            </span>
            <span className="bg-white text-slate-700 px-2.5 py-1 rounded-md font-medium border border-slate-200 flex items-center space-x-1.5">
              <i className="fa-solid fa-cubes text-indigo-600 text-[10px]" />
              <span><strong className="text-slate-900">Workspace:</strong> {activeConnection?.workspaceName ?? activeConnection?.workspaceId ?? '—'}</span>
            </span>
            {configured && state.config?.uri && (
              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono text-[10px] border border-slate-200 flex items-center space-x-1.5 max-w-full" title="Configured Landing Zone Storage Path">
                <i className="fa-solid fa-server text-slate-500" />
                <span className="truncate">{state.config.uri}</span>
              </span>
            )}
            {configured && (
              <span className="text-slate-400 text-[11px] pl-1 flex items-center space-x-1">
                <i className="fa-regular fa-clock" />
                <span>Refreshed: <strong className="text-slate-600 font-medium">{timeAgo(state.lastRefreshed)}</strong></span>
              </span>
            )}
          </div>
        </div>

        {configured && (
          <div className="flex items-center space-x-2 shrink-0">
            <button type="button" onClick={() => setDialog({ type: 'configure' })} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg transition-colors flex items-center space-x-1.5">
              <i className="fa-solid fa-sliders text-slate-400" />
              <span>Change Location</span>
            </button>
            <button
              type="button"
              disabled={state.working}
              onClick={() => {
                if (window.confirm('Remove the Landing Zone configuration of this connection? Files are not deleted.')) void state.removeConfig();
              }}
              className="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-[11px] font-semibold rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <i className="fa-regular fa-trash-can" />
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>

      {/* states without a browsable Landing Zone */}
      {!state.hasConnection && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl mx-auto">
            <i className="fa-solid fa-plug" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No active connection</h2>
          <p className="text-xs text-slate-500">Set an active connection to browse its Landing Zone.</p>
          <Link href="/connection" className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl">Go to Connection</Link>
        </div>
      )}

      {state.hasConnection && state.configState === 'loading' && (
        <div className="p-12 text-center text-xs text-slate-400"><i className="fa-solid fa-spinner fa-spin mr-2" />Loading Landing Zone…</div>
      )}

      {state.hasConnection && state.configState === 'error' && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center max-w-xl mx-auto space-y-3">
          <p className="text-sm font-bold text-rose-700">Could not load the Landing Zone configuration</p>
          <p className="text-xs text-slate-500">{state.configError}</p>
          <button type="button" onClick={() => void state.reloadConfig()} className="px-4 py-2 bg-white border border-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-50">Retry</button>
        </div>
      )}

      {state.hasConnection && state.configState === 'ready' && !configured && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center text-2xl mx-auto">
            <i className="fa-solid fa-folder-plus" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900">Landing Zone Not Configured</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Configure a Landing Zone storage location for the active connection (<strong className="text-slate-700">{activeConnection?.name}</strong>) to start browsing, uploading, and organizing files.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center space-x-3">
            <button type="button" onClick={() => setDialog({ type: 'configure' })} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-2">
              <i className="fa-solid fa-gear" />
              <span>Configure Landing Zone</span>
            </button>
            <Link href="/connection" className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition-colors">Go to Connection</Link>
          </div>
        </div>
      )}

      {/* explorer */}
      {configured && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            <div className="lg:col-span-3 h-[580px]">
              <FolderTree state={state} onNewFolder={() => setDialog({ type: 'newFolder' })} />
            </div>
            <div className="lg:col-span-9 h-[580px]">
              <FileBrowser
                state={state}
                onOpenFile={setDrawerItem}
                onUpload={() => setDialog({ type: 'upload' })}
                onNewFolder={() => setDialog({ type: 'newFolder' })}
                onRename={(item) => setDialog({ type: 'rename', item })}
                onDelete={(items) => setDialog({ type: 'delete', items })}
                onTransfer={(mode, items) => setDialog({ type: 'transfer', mode, items })}
              />
            </div>
          </div>

          <OperationsPanel operations={state.operations} />
        </div>
      )}

      {/* dialogs */}
      {dialog?.type === 'configure' && (
        <ConfigureDialog currentUri={state.config?.uri ?? null} working={state.working} onSubmit={state.saveConfig} onClose={closeDialog} />
      )}
      {dialog?.type === 'upload' && (
        <UploadDialog destination={state.currentPath} working={state.working} onSubmit={state.upload} onClose={closeDialog} />
      )}
      {dialog?.type === 'newFolder' && (
        <NewFolderDialog parentPath={state.currentPath} working={state.working} onSubmit={state.createFolder} onClose={closeDialog} />
      )}
      {dialog?.type === 'rename' && (
        <RenameDialog item={dialog.item} working={state.working} onSubmit={(name) => state.renameItem(dialog.item, name)} onClose={closeDialog} />
      )}
      {dialog?.type === 'delete' && (
        <DeleteDialog
          items={dialog.items}
          working={state.working}
          onConfirm={() => state.deleteItems(dialog.items.map((i) => ({ path: i.path, isFolder: i.isFolder })))}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'transfer' && (
        <TransferDialog
          mode={dialog.mode}
          items={dialog.items}
          state={state}
          onSubmit={(destination) => state.transfer(dialog.mode, dialog.items.map((i) => ({ path: i.path, isFolder: i.isFolder })), destination)}
          onClose={closeDialog}
        />
      )}

      {drawerItem && state.connectionId && (
        <FileDrawer
          item={drawerItem}
          connectionId={state.connectionId}
          onClose={() => setDrawerItem(null)}
          onDownload={(item) => void state.downloadItems([item])}
          downloading={state.downloadingPaths.has(drawerItem.path)}
          onRename={(item) => {
            setDrawerItem(null);
            setDialog({ type: 'rename', item });
          }}
          onMove={(item) => {
            setDrawerItem(null);
            setDialog({ type: 'transfer', mode: 'move', items: [item] });
          }}
          onDelete={(item) => {
            setDrawerItem(null);
            setDialog({ type: 'delete', items: [item] });
          }}
        />
      )}
    </section>
  );
}
