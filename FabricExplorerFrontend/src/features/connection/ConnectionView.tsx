'use client';

import { useEffect, useState } from 'react';
import * as connectionsApi from '@/lib/api/connections.api';
import { BUSY_CLASS, useBusy } from '@/hooks/useBusy';
import { useConnection } from '@/providers/ConnectionProvider';
import { useToast } from '@/providers/ToastProvider';
import type { Connection } from '@/types/connection';
import { ActiveConnectionCard } from './components/ActiveConnectionCard';
import { ConnectionCard } from './components/ConnectionCard';
import { OAuthModal } from './components/OAuthModal';
import { Pagination } from './components/Pagination';
import { CONN_PAGE_SIZE_MAX } from './constants';
import { useConnections } from './hooks/useConnections';
import { clampPageSize } from './utils';

interface ModalState {
  isEdit: boolean;
  conn: Connection | null;
}

export function ConnectionView() {
  const { showToast, showApiError } = useToast();
  const { activeConnection } = useConnection();
  const { connections, paging, load, goToPage, reload } = useConnections();
  const { isBusy, withBusy } = useBusy();

  const [modal, setModal] = useState<ModalState | null>(null);
  const [sizeInput, setSizeInput] = useState(String(paging.pageSize));

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setSizeInput(String(paging.pageSize));
  }, [paging.pageSize]);

  const openModal = async (isEdit: boolean) => {
    let conn: Connection | null = null;
    if (isEdit) {
      try {
        conn = await connectionsApi.getActive();
      } catch (err) {
        showApiError(err, 'Could not load active connection');
        return;
      }
      if (!conn) {
        showToast('No active connection', 'warning');
        return;
      }
    }
    setModal({ isEdit, conn });
  };

  const testSaved = async () => {
    if (!activeConnection) return showToast('No active connection', 'warning');
    try {
      await connectionsApi.testSaved(activeConnection.id);
      showToast('Active connection check succeeded', 'success');
    } catch (err) {
      showApiError(err, 'Active connection check failed');
    }
  };

  const activate = async (id: string) => {
    try {
      await connectionsApi.activate(id);
    } catch (err) {
      return showApiError(err, 'Could not switch connection');
    }
    const active = await load();
    showToast(active?.name ? `Switched active connection to "${active.name}"` : 'Active connection switched', 'success');
  };

  const handleSaved = async (saved: Connection | undefined, isEdit: boolean) => {
    setModal(null);
    const active = await load();

    if (!isEdit && !active && saved?.id) {
      try {
        await connectionsApi.activate(saved.id);
        await load();
      } catch (err) {
        showApiError(err, 'Saved, but could not activate the new connection');
      }
    }
    showToast('Connection saved successfully', 'success');
  };

  const refresh = async () => {
    const size = clampPageSize(sizeInput);
    setSizeInput(String(size));
    if (String(size) !== sizeInput.trim()) {
      showToast(`Page size must be between 1 and ${CONN_PAGE_SIZE_MAX}`, 'warning');
    }
    await withBusy('refresh', () => reload(size).then(() => undefined));
  };

  const refreshing = isBusy('refresh');

  return (
    <section className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Connection Management</h1>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Single Active Session
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Manage and switch between your Microsoft Fabric environment connections.</p>
        </div>
        <button
          type="button"
          onClick={() => openModal(false)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center space-x-2 shrink-0"
        >
          <i className="fa-solid fa-plus" />
          <span>Add Connection</span>
        </button>
      </div>

      <ActiveConnectionCard active={activeConnection} onTest={testSaved} onEdit={() => openModal(true)} />

      {/* Saved connections */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Saved Connections</h3>
            <p className="text-xs text-slate-500">Select any connection below to switch the active working environment.</p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono text-slate-400">
              {`${paging.total} Saved Profile${paging.total === 1 ? '' : 's'}`}
            </span>

            <div className="flex items-center space-x-2">
              <label htmlFor="connPageSize" className="text-xs text-slate-500 whitespace-nowrap">
                Page size
              </label>
              <input
                id="connPageSize"
                type="number"
                min={1}
                max={CONN_PAGE_SIZE_MAX}
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void refresh();
                }}
                className="w-16 px-2 py-1.5 text-xs border border-slate-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
              <button
                type="button"
                title="Refresh"
                disabled={refreshing}
                onClick={refresh}
                className={`px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${refreshing ? BUSY_CLASS : ''}`}
              >
                <i className={`fa-solid fa-rotate-right text-slate-400 ${refreshing ? 'fa-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.length === 0 ? (
            <div className="md:col-span-2 text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl p-6 text-center">
              No saved connections yet. Click <b>Add Connection</b> to create one.
            </div>
          ) : (
            connections.map((conn) => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                active={conn.id === activeConnection?.id}
                onActivate={() => activate(conn.id)}
              />
            ))
          )}
        </div>

        <Pagination
          page={paging.page}
          pageSize={paging.pageSize}
          total={paging.total}
          totalPages={paging.totalPages}
          count={connections.length}
          onChange={(p) => void goToPage(p)}
        />
      </div>

      {modal && <OAuthModal isEdit={modal.isEdit} conn={modal.conn} onClose={() => setModal(null)} onSaved={handleSaved} />}
    </section>
  );
}
