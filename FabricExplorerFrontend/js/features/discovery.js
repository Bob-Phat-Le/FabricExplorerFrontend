import * as store from '../state/store.js';
import { copyToClipboard, escapeHtml, showApiError, showToast } from '../core/ui.js';
import { formatDateTime, formatNumber, formatSeconds, timeAgo } from '../core/format.js';
import { sleep } from '../api/client.js';
import * as discoveryApi from '../api/discovery.api.js';
import { CHECKING } from '../api/stream.js';

const $ = id => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el) el.innerText = text; };
const setHtml = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
const show = id => $(id)?.classList.remove('hidden');
const hide = id => $(id)?.classList.add('hidden');

const MASK = '••••••••••••••••••••••••••••••••••••••••';
const EMPTY = '—';

const TONES = {
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    bad: 'bg-rose-50 text-rose-700 border-rose-200',
    muted: 'bg-slate-50 text-slate-600 border-slate-200',
};

function badge(label, tone = 'muted', title = '') {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    // "Checking" = giá trị tạm của backend khi kết quả thật đang đến qua stream
    const checking = label === CHECKING;
    const icon = checking ? '<i class="fa-solid fa-circle-notch fa-spin mr-1 text-[10px]"></i>' : '● ';
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${TONES[checking ? 'info' : tone]}"${titleAttr}>${icon}${escapeHtml(label)}</span>`;
}

const skeleton = (width = 'w-12') => `<span class="inline-block h-3 ${width} rounded bg-slate-200 animate-pulse align-middle" title="Loading…"></span>`;

const TABLE_STATUS_TONE = { Healthy: 'ok', Empty: 'muted', Stale: 'warn', Error: 'bad', Unknown: 'muted' };
const ONLINE_STATUS_TONE = { Online: 'ok', Offline: 'bad', Unknown: 'muted' };
const DB_STATUS_TONE = { Active: 'ok', Offline: 'bad', Unknown: 'muted' };
const MIRRORING_STATUS_TONE = { Running: 'ok', Starting: 'info', Initializing: 'info', Stopping: 'warn', Stopped: 'muted', Paused: 'muted', Initialized: 'muted', Unknown: 'muted' };
const TABLE_MIRRORING_TONE = { Replicating: 'ok', Snapshotting: 'info', Reseeding: 'info', Initialized: 'info', Stopped: 'muted', Failed: 'bad', Unknown: 'muted' };

// Các stream SSE đang chạy, theo key. Key 'abc#n' thuộc nhóm 'abc' (stopStreams('abc') dừng cả nhóm).
const streamCtrls = new Map();

function stopStreams(group) {
    for (const [key, ctrl] of streamCtrls) {
        if (key === group || key.startsWith(`${group}#`)) {
            ctrl.abort();
            streamCtrls.delete(key);
        }
    }
}

/**
 * Nhận sự kiện live của `live` (kết quả discoveryApi có isStreaming) và gọi handlers[tênSựKiện](payload).
 * `onSettled` chạy khi stream kết thúc hoặc lỗi (không chạy khi bị hủy) để chốt lại các trường còn "Checking",
 * tránh UI kẹt ở trạng thái đang kiểm tra.
 */
function followStream(key, live, handlers, onSettled) {
    streamCtrls.get(key)?.abort();
    streamCtrls.delete(key);
    if (!live?.isStreaming) return;

    const ctrl = new AbortController();
    streamCtrls.set(key, ctrl);

    discoveryApi.openStream(live, handlers, { signal: ctrl.signal })
        .then(() => { if (!ctrl.signal.aborted) onSettled?.(); })
        .catch(err => {
            if (ctrl.signal.aborted) return;
            console.warn('Live update failed', err);
            showToast(`Live update failed: ${escapeHtml(err?.message || 'unknown error')}`, 'warning');
            onSettled?.(err);
        })
        .finally(() => { if (streamCtrls.get(key) === ctrl) streamCtrls.delete(key); });
}

const seqs = {};
const ctrls = {};
function latest(key) {
    stopStreams(key);
    ctrls[key]?.abort();
    const ctrl = (ctrls[key] = new AbortController());
    const n = (seqs[key] = (seqs[key] || 0) + 1);
    const isCurrent = () => seqs[key] === n;
    isCurrent.signal = ctrl.signal;
    return isCurrent;
}
const invalidate = (...keys) => keys.forEach(k => { seqs[k] = (seqs[k] || 0) + 1; ctrls[k]?.abort(); stopStreams(k); });

async function withBusy(ids, fn) {
    const buttons = [].concat(ids).map($).filter(Boolean);
    const set = busy => buttons.forEach(b => {
        b.disabled = busy;
        b.classList.toggle('opacity-60', busy);
        b.classList.toggle('cursor-not-allowed', busy);
    });
    set(true);
    try { await fn(); } finally { set(false); }
}

function context() {
    const conn = store.connections.activeConnection;
    return conn ? { connectionId: conn.id, workspaceId: conn.workspaceId } : null;
}

function requireContext() {
    const ctx = context();
    if (!ctx) showToast('Set an active connection first (Connection tab).', 'warning');
    return ctx;
}

const RESOURCES = {
    lakehouse: {
        selectId: 'lakehouseSelect', noun: 'lakehouse', cardId: 'cardResLakehouse',
        fetch: discoveryApi.listLakehouses,
        idOf: i => i.lakehouseId, nameOf: i => i.lakehouseName,
        resultCards: ['lakehouseGridContainer'], seqKeys: ['tables'],
    },
    warehouse: {
        selectId: 'warehouseSelect', noun: 'warehouse', cardId: 'cardResWarehouse',
        fetch: discoveryApi.listWarehouses,
        idOf: i => i.warehouseId, nameOf: i => i.warehouseName,
        resultCards: ['warehouseDetailsCard', 'connStringCard'], seqKeys: ['warehouse', 'connString'],
    },
    mirrored: {
        selectId: 'mirroredSelect', noun: 'mirrored database', cardId: 'cardResMirrored',
        fetch: discoveryApi.listMirroredDatabases,
        idOf: i => i.mirroredDatabaseId, nameOf: i => i.mirroredDatabaseName,
        resultCards: ['mirroredDbDetailsCard', 'mirroringStatusCard', 'tablesMirroringGridCard'],
        seqKeys: ['mirroredDb', 'mirroringStatus', 'tablesStatus', 'mirrorAction', 'statusFollow'],
    },
};

const CARD_ON = 'cursor-pointer border-2 border-indigo-600 bg-indigo-50/40 rounded-xl p-4 transition-all shadow-sm group';
const CARD_OFF = 'cursor-pointer border border-slate-200 bg-white hover:border-indigo-300 rounded-xl p-4 transition-all shadow-sm group';
const ICON_ON = 'w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-sm';
const ICON_OFF = 'w-10 h-10 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center text-lg font-bold transition-colors';

let currentResource = 'lakehouse';
const loadedFor = {};
// const workspaceCache = {};
// const WORKSPACE_FETCH_CONCURRENCY = 4;
const listSeq = {};
const lists = {};
const listCtrl = {};

export function switchDiscoveryResource(resType) {
    currentResource = resType;
    Object.entries(RESOURCES).forEach(([key, cfg]) => {
        const active = key === resType;
        $(`disc-sub-${key}`)?.classList.toggle('hidden', !active);
        const card = $(cfg.cardId);
        if (card) {
            card.className = active ? CARD_ON : CARD_OFF;
            const icon = card.firstElementChild?.firstElementChild;
            if (icon) icon.className = active ? ICON_ON : ICON_OFF;
        }
    });
    ensureLoaded(resType);
}

export function loadDiscoveryResources() {
    return ensureLoaded(currentResource);
}

export function reloadDiscoveryList(resType) {
    return ensureLoaded(resType, { force: true });
}

export function onDiscoverySelectionChange(resType) {
    clearResults(resType);
}

function clearResults(resType) {
    const cfg = RESOURCES[resType];
    invalidate(...cfg.seqKeys);
    cfg.resultCards.forEach(hide);
    if (resType === 'warehouse') resetConnString();
    if (resType === 'lakehouse') { stopStreams('tablesLive'); lakeTables = []; lakeNextToken = null; lakeSelection = null; }
}

function setPlaceholder(resType, text) {
    const select = $(RESOURCES[resType].selectId);
    if (!select) return;
    select.replaceChildren(new Option(text, ''));
    select.disabled = true;
}

// async function ensureLoaded(resType, { force = false } = {}) {
//     const cfg = RESOURCES[resType];
//     const ctx = context();
//     if (!ctx) {
//         loadedFor[resType] = null;
//         clearResults(resType);
//         setPlaceholder(resType, 'No active connection — set one in the Connection tab');
//         return;
//     }

//     const key = ctx.connectionId;
//     if (!force && loadedFor[resType] === key) return;
//     if (force) delete workspaceCache[key];

//     listCtrl[resType]?.abort();
//     const ctrl = (listCtrl[resType] = new AbortController());
//     const seq = (listSeq[resType] = (listSeq[resType] || 0) + 1);
//     clearResults(resType);
//     setPlaceholder(resType, 'Loading…');
//     try {
//         const { items, skipped } = await cfg.fetch({
//             ...ctx,
//             refresh: force,
//             signal: ctrl.signal
//         });
//         if (seq !== listSeq[resType]) return;
//         lists[resType] = items;
//         loadedFor[resType] = key;

//         const select = $(cfg.selectId);
//         if (skipped) showToast(`${skipped} workspace${skipped === 1 ? '' : 's'} could not be read and ${skipped === 1 ? 'was' : 'were'} skipped.`, 'warning');
//         if (!items.length) {
//             setPlaceholder(resType, `No ${cfg.noun}s found in your workspaces`);
//             return;
//         }
//         select.replaceChildren(...items.map(item =>
//             new Option(`${cfg.nameOf(item)} (${item.workspaceName ?? 'Workspace'})`, cfg.idOf(item))));
//         select.disabled = false;
//     } catch (err) {
//         if (seq !== listSeq[resType]) return;
//         loadedFor[resType] = null;
//         setPlaceholder(resType, `Could not load ${cfg.noun}s — click Reload`);
//         showApiError(err, `Could not load ${cfg.noun}s`);
//     }
// }

async function ensureLoaded(resType, { force = false } = {}) {
    const cfg = RESOURCES[resType];
    const ctx = context();

    if (!ctx) {
        loadedFor[resType] = null;
        clearResults(resType);
        setPlaceholder(
            resType,
            'No active connection — set one in the Connection tab'
        );
        return;
    }

    const key = ctx.connectionId;

    if (!force && loadedFor[resType] === key) return;

    listCtrl[resType]?.abort();

    const ctrl = (listCtrl[resType] = new AbortController());
    const seq = (listSeq[resType] = (listSeq[resType] || 0) + 1);

    clearResults(resType);
    setPlaceholder(resType, 'Loading…');

    try {
        const items = (await cfg.fetch({
            ...ctx,
            refresh: force,
            signal: ctrl.signal
        })) ?? [];

        if (seq !== listSeq[resType]) return;

        lists[resType] = items;
        loadedFor[resType] = key;

        const select = $(cfg.selectId);

        if (!items.length) {
            setPlaceholder(
                resType,
                `No ${cfg.noun}s found in workspace`
            );
            return;
        }

        select.replaceChildren(
            ...items.map(item =>
                new Option(
                    `${cfg.nameOf(item)} (${item.workspaceName ?? 'Workspace'})`,
                    cfg.idOf(item)
                )
            )
        );

        select.disabled = false;

    } catch (err) {
        if (seq !== listSeq[resType]) return;
        loadedFor[resType] = null;
        setPlaceholder(
            resType,
            `Could not load ${cfg.noun}s — click Reload`
        );
        showApiError(err, `Could not load ${cfg.noun}s`);
    }
}

// function getWorkspaces(ctx, refresh = false) {
//     workspaceCache[ctx.connectionId] ||= discoveryApi.listWorkspaces({ ...ctx, refresh }).then(list => list ?? []);
//     return workspaceCache[ctx.connectionId].catch(err => { delete workspaceCache[ctx.connectionId]; throw err; });
// }

// async function fetchFromAllWorkspaces(cfg, ctx, { refresh = false, signal } = {}) {
//     const workspaces = await getWorkspaces(ctx, refresh);
//     const results = new Array(workspaces.length);
//     let next = 0;

//     async function worker() {
//         while (next < workspaces.length && !signal?.aborted) {
//             const i = next++;
//             try {
//                 const items = (await cfg.fetch({ ...ctx, workspaceId: workspaces[i].workspaceId, refresh, signal })) ?? [];
//                 results[i] = { ok: true, items: items.map(it => ({ ...it, workspaceId: it.workspaceId ?? workspaces[i].workspaceId, workspaceName: it.workspaceName ?? workspaces[i].workspaceName })) };
//             } catch (err) {
//                 console.warn(`Could not list ${cfg.noun}s in workspace ${workspaces[i].workspaceId}`, err);
//                 results[i] = { ok: false, err };
//             }
//         }
//     }
//     await Promise.all(Array.from({ length: Math.min(WORKSPACE_FETCH_CONCURRENCY, workspaces.length) }, worker));
//     if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

//     const failed = results.filter(r => !r.ok);
//     if (workspaces.length && failed.length === workspaces.length) throw failed[0].err;

//     const items = results.filter(r => r.ok).flatMap(r => r.items)
//         .sort((a, b) => cfg.nameOf(a).localeCompare(cfg.nameOf(b), undefined, { sensitivity: 'base' })
//             || String(a.workspaceName).localeCompare(String(b.workspaceName)));
//     return { items, skipped: failed.length };
// }

function selectedItem(resType) {
    const cfg = RESOURCES[resType];
    const id = $(cfg.selectId)?.value;
    const item = id ? (lists[resType] ?? []).find(i => cfg.idOf(i) === id) : null;
    if (!item) showToast(`Select a ${cfg.noun} first.`, 'warning');
    return item ?? null;
}


let lakeTables = [];
let lakeNextToken = null;
let lakeSelection = null;

export function executeListTables() { return loadTables({ append: false }); }

export function refreshTables() { return loadTables({ append: false, refresh: true }); }

export function loadMoreTables() { return lakeNextToken ? loadTables({ append: true }) : undefined; }

async function loadTables({ append, refresh = false }) {
    const ctx = requireContext();
    if (!ctx) return;
    let selection = append ? lakeSelection : null;
    if (!selection) {
        const item = selectedItem('lakehouse');
        if (!item) return;
        selection = { workspaceId: item.workspaceId, lakehouseId: item.lakehouseId };
    }

    const isCurrent = latest('tables');
    if (!append) stopStreams('tablesLive'); // danh sách mới: bỏ các stream của danh sách cũ (Load more thì giữ lại)
    await withBusy(append ? 'btnLakeLoadMore' : ['btnListTables', 'btnRefreshTables'], async () => {
        try {
            const page = await discoveryApi.listLakehouseTables({
                ...ctx, ...selection, continuationToken: append ? lakeNextToken : undefined, refresh, signal: isCurrent.signal,
            });
            if (!isCurrent()) return;

            lakeSelection = selection;
            lakeTables = append ? lakeTables.concat(page.items) : page.items;
            lakeNextToken = page.nextToken;
            show('lakehouseGridContainer');
            renderLakehouseGrid();
            trackTableStats(page.live, page.items);
            if (!append) showToast(`Retrieved ${lakeTables.length}${lakeNextToken ? '+' : ''} table${lakeTables.length === 1 ? '' : 's'} for Lakehouse`, 'info');
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not list tables');
        }
    });
}

export function filterLakehouseGrid() { renderLakehouseGrid(); }

let tableStreamSeq = 0;
let gridRenderQueued = false;

// Nhiều bảng có thể xong gần như cùng lúc: gom lại thành một lần vẽ mỗi frame
function scheduleGridRender() {
    if (gridRenderQueued) return;
    gridRenderQueued = true;
    requestAnimationFrame(() => { gridRenderQueued = false; renderLakehouseGrid(); });
}

// Mỗi trang bảng có stream riêng; chỉ cập nhật/chốt các dòng thuộc trang đó
function trackTableStats(live, pageItems) {
    if (!live?.isStreaming) return;
    const byName = new Map(pageItems.map(t => [t.name, t]));

    followStream(`tablesLive#${++tableStreamSeq}`, live, {
        'table-stats': patch => {
            const row = byName.get(patch.name);
            if (!row) return;
            Object.assign(row, patch);
            scheduleGridRender();
        },
    }, () => {
        let changed = false;
        for (const row of pageItems) {
            if (row.status !== CHECKING) continue;
            row.status = 'Unknown';
            row.statusMessage = 'Statistics are unavailable.';
            changed = true;
        }
        if (changed) scheduleGridRender();
    });
}

export function inspectTable(tableName) {
    showToast(`Inspecting table ${escapeHtml(tableName)}`, 'info');
}

function renderLakehouseGrid() {
    const tbody = $('lakehouseTableBody');
    if (!tbody) return;

    const term = ($('lakeTableSearch')?.value ?? '').trim().toLowerCase();
    const rows = term ? lakeTables.filter(t => t.name?.toLowerCase().includes(term)) : lakeTables;

    if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-slate-400">${lakeTables.length ? 'No tables match your search.' : 'No tables found in this lakehouse.'}</td></tr>`;
    } else {
        tbody.innerHTML = rows.map(t => `
            <tr class="hover:bg-slate-50 lake-row">
                <td class="p-3 pl-4 font-bold text-slate-900">${escapeHtml(t.name)}</td>
                <td class="p-3 font-mono">${escapeHtml(t.format || t.type || EMPTY)}${t.format && t.type ? ` <span class="text-slate-400">${escapeHtml(t.type)}</span>` : ''}</td>
                <td class="p-3 font-mono">${t.status === CHECKING ? skeleton('w-12') : formatNumber(t.rowCount)}</td>
                <td class="p-3 text-slate-500" title="${t.status === CHECKING ? '' : escapeHtml(formatDateTime(t.lastModifiedTime))}">${t.status === CHECKING ? skeleton('w-16') : timeAgo(t.lastModifiedTime)}</td>
                <td class="p-3">${badge(t.status || 'Unknown', TABLE_STATUS_TONE[t.status] ?? 'muted', t.statusMessage ?? '')}</td>
                <td class="p-3 text-right pr-4"><button type="button" data-table="${escapeHtml(t.name)}" class="text-indigo-600 font-semibold hover:underline">View</button></td>
            </tr>`).join('');
        tbody.querySelectorAll('button[data-table]').forEach(b => b.addEventListener('click', () => inspectTable(b.dataset.table)));
    }

    setText('lakehouseGridSummary', `Showing ${rows.length} of ${lakeTables.length} loaded table${lakeTables.length === 1 ? '' : 's'}${lakeNextToken ? ' (more available)' : ''}`);
    $('btnLakeLoadMore')?.classList.toggle('hidden', !lakeNextToken);
}

let connString = '';
let isConnStringVisible = false;

export async function executeGetWarehouse() {
    const ctx = requireContext();
    const item = ctx && selectedItem('warehouse');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, warehouseId: item.warehouseId };

    const isCurrent = latest('warehouse');
    await withBusy('btnGetWarehouse', async () => {
        try {
            const live = await discoveryApi.getWarehouse({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;

            const wh = live.data;
            renderWarehouse(wh);
            show('warehouseDetailsCard');

            // Probe SQL có thể chậm: onlineStatus = "Checking" cho tới khi sự kiện online-status đến
            followStream('warehouse', live, {
                'online-status': patch => { Object.assign(wh, patch); renderWarehouse(wh); },
            }, () => {
                if (wh.onlineStatus !== CHECKING) return;
                wh.onlineStatus = 'Unknown';
                wh.onlineStatusMessage = 'Could not determine the online status.';
                renderWarehouse(wh);
            });
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load warehouse');
        }
    });
}

function renderWarehouse(wh) {
    setText('whName', wh.name ?? EMPTY);
    setHtml('whStatus', badge(wh.onlineStatus ?? 'Unknown', ONLINE_STATUS_TONE[wh.onlineStatus] ?? 'muted', wh.onlineStatusMessage ?? ''));
    setText('whWorkspace', wh.workspace?.name ?? EMPTY);
    setText('whWorkspaceId', wh.workspace?.id ?? EMPTY);
    setText('whCreated', formatDateTime(wh.createdDate));
    setText('whUpdated', formatDateTime(wh.lastUpdatedTime));

    const message = $('whStatusMessage');
    if (message) {
        message.innerText = wh.onlineStatusMessage ?? '';
        message.classList.toggle('hidden', !wh.onlineStatusMessage);
    }
}

export async function executeGetConnString() {
    const ctx = requireContext();
    const item = ctx && selectedItem('warehouse');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, warehouseId: item.warehouseId };

    const isCurrent = latest('connString');
    await withBusy('btnGetConnString', async () => {
        try {
            const result = await discoveryApi.getWarehouseConnectionString({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;

            connString = result?.connectionString ?? '';
            isConnStringVisible = false;
            setText('connStringText', MASK);
            setText('btnToggleConnStr', 'Show');
            show('connStringCard');
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load connection string');
        }
    });
}

export function toggleConnStringVisibility() {
    isConnStringVisible = !isConnStringVisible;
    setText('connStringText', isConnStringVisible ? connString : MASK);
    setText('btnToggleConnStr', isConnStringVisible ? 'Hide' : 'Show');
}

export function copyConnString() {
    if (!connString) return;
    copyToClipboard(connString, 'Connection string copied');
}

function resetConnString() {
    connString = '';
    isConnStringVisible = false;
    setText('connStringText', MASK);
    setText('btnToggleConnStr', 'Show');
}

const STATUS_POLL_MS = 4000;
const STATUS_POLL_MAX = 15;

export async function executeGetMirroredDb() {
    const ctx = requireContext();
    const item = ctx && selectedItem('mirrored');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, mirroredDatabaseId: item.mirroredDatabaseId };

    const isCurrent = latest('mirroredDb');
    await withBusy('btnGetMirroredDb', async () => {
        try {
            const live = await discoveryApi.getMirroredDb({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;

            const db = live.data;
            renderMirroredDb(db);
            show('mirroredDbDetailsCard');

            // mirroring-status và source-info độc lập nhau: cái nào xong trước hiện trước
            followStream('mirroredDb', live, {
                'mirroring-status': patch => { Object.assign(db, patch); renderMirroredDb(db); },
                'source-info': patch => { Object.assign(db, patch); renderMirroredDb(db); },
            }, () => {
                let changed = false;
                if (db.status === CHECKING || db.mirroringStatus === CHECKING) {
                    db.status = 'Unknown';
                    db.mirroringStatus = 'Unknown';
                    changed = true;
                }
                if (db.sourceName === CHECKING || db.sourceType === CHECKING) {
                    db.sourceName = null;
                    db.sourceType = null;
                    changed = true;
                }
                if (changed) renderMirroredDb(db);
            });
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load mirrored database');
        }
    });
}

function renderMirroredDb(db) {
    const mirroringChecking = db.mirroringStatus === CHECKING;
    setText('mdbName', db.mirroredDatabaseName ?? EMPTY);
    setText('mdbWorkspace', db.workspaceName ?? EMPTY);
    setHtml('mdbStatus', badge(db.status ?? 'Unknown', DB_STATUS_TONE[db.status] ?? 'muted', `Mirroring status: ${db.mirroringStatus ?? 'Unknown'}`)
        + (mirroringChecking ? '' : `<span class="ml-1.5 text-[11px] font-normal text-slate-400">${escapeHtml(db.mirroringStatus ?? '')}</span>`));

    if (db.sourceName === CHECKING || db.sourceType === CHECKING) {
        setHtml('mdbSource', skeleton('w-32'));
    } else {
        setText('mdbSource', [db.sourceName, db.sourceType && db.sourceType !== db.sourceName ? `(${db.sourceType})` : '']
            .filter(Boolean).join(' ') || EMPTY);
    }
    setText('mdbCreated', db.createdAt ? formatDateTime(db.createdAt) : 'Not available');
}

export async function executeGetMirroringStatus() {
    const ctx = requireContext();
    const item = ctx && selectedItem('mirrored');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, mirroredDatabaseId: item.mirroredDatabaseId };

    const isCurrent = latest('mirroringStatus');
    await withBusy('btnGetMirroringStatus', async () => {
        try {
            const live = await discoveryApi.getMirroringStatus({ ...target, signal: isCurrent.signal });
            if (isCurrent()) trackMirroringStatus('mirroringStatus', live);
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load mirroring status');
        }
    });
}

// Status trả ngay; lastSynchronization / recordSynchronized / currentLatency (tổng hợp từ các bảng) đến sau qua sự kiện mirroring-metrics
function trackMirroringStatus(key, live) {
    const status = live.data;
    const pending = new Set(live.isStreaming ? live.pendingFields : []);
    renderMirroringStatus(status, pending);

    followStream(key, live, {
        'mirroring-metrics': patch => {
            Object.assign(status, patch);
            Object.keys(patch).forEach(field => pending.delete(field));
            renderMirroringStatus(status, pending);
        },
    }, () => {
        if (!pending.size) return;
        pending.forEach(field => { status[field] = null; });
        pending.clear();
        renderMirroringStatus(status, pending);
    });
}

function renderMirroringStatus(status, pending = new Set()) {
    setHtml('mirroringStatusBadge', badge(status.status ?? 'Unknown', MIRRORING_STATUS_TONE[status.status] ?? 'muted'));

    const lastSync = $('msLastSync');
    if (pending.has('lastSynchronization')) {
        setHtml('msLastSync', skeleton('w-16'));
        lastSync?.removeAttribute('title');
    } else {
        setText('msLastSync', status.lastSynchronization ? timeAgo(status.lastSynchronization) : EMPTY);
        lastSync?.setAttribute('title', formatDateTime(status.lastSynchronization));
    }

    if (pending.has('recordSynchronized')) setHtml('msRecords', skeleton('w-16'));
    else setText('msRecords', formatNumber(status.recordSynchronized));

    if (pending.has('currentLatency')) setHtml('msLatency', skeleton('w-10'));
    else setText('msLatency', status.currentLatency === null || status.currentLatency === undefined ? EMPTY : formatSeconds(status.currentLatency));

    show('mirroringStatusCard');
}

export function openStartMirrorModal() { return changeMirroring('start'); }

export function openStopMirrorModal() {
    const select = $(RESOURCES.mirrored.selectId);
    const name = select?.selectedOptions?.[0]?.text;
    if (select?.value && !window.confirm(`Stop mirroring for "${name}"?`)) return;
    return changeMirroring('stop');
}

async function changeMirroring(action) {
    const ctx = requireContext();
    const item = ctx && selectedItem('mirrored');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, mirroredDatabaseId: item.mirroredDatabaseId };

    const isStart = action === 'start';
    const isCurrent = latest('mirrorAction');
    await withBusy(['btnStartMirroring', 'btnStopMirroring'], async () => {
        try {
            const api = isStart ? discoveryApi.startMirroring : discoveryApi.stopMirroring;
            const result = await api(target);
            if (!isCurrent()) return;
            showToast(escapeHtml(result?.message || (isStart ? 'Mirroring process started' : 'Mirroring process stopped')), isStart ? 'success' : 'warning');
        } catch (err) {
            if (isCurrent()) showApiError(err, isStart ? 'Could not start mirroring' : 'Could not stop mirroring');
            return;
        }
        followMirroringStatus(target, isStart ? ['Running'] : ['Stopped']);
    });
}

async function followMirroringStatus(target, targets) {
    const isCurrent = latest('statusFollow');
    for (let i = 0; i < STATUS_POLL_MAX; i++) {
        await sleep(STATUS_POLL_MS);
        if (!isCurrent()) return;
        try {
            const live = await discoveryApi.getMirroringStatus({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;
            trackMirroringStatus('statusFollow', live);
            if (targets.includes(live.data.status)) return;
        } catch (err) {
            console.warn('Mirroring status poll failed', err);
        }
    }
}

export async function executeGetTablesMirroringStatus() {
    const ctx = requireContext();
    const item = ctx && selectedItem('mirrored');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, mirroredDatabaseId: item.mirroredDatabaseId };

    const isCurrent = latest('tablesStatus');
    await withBusy('btnTablesStatus', async () => {
        try {
            const rows = (await discoveryApi.getTablesMirroringStatus({ ...target, signal: isCurrent.signal })) ?? [];
            if (!isCurrent()) return;

            const tbody = $('tablesMirroringBody');
            if (tbody) {
                tbody.innerHTML = rows.length
                    ? rows.map(r => `
                        <tr>
                            <td class="p-3 pl-4 font-bold text-slate-900">${escapeHtml(r.tableName)}</td>
                            <td class="p-3 font-mono">${escapeHtml(r.source)}</td>
                            <td class="p-3 font-mono">${escapeHtml(r.target)}</td>
                            <td class="p-3">${badge(r.status ?? 'Unknown', TABLE_MIRRORING_TONE[r.status] ?? 'muted')}</td>
                            <td class="p-3 text-slate-500" title="${escapeHtml(formatDateTime(r.lastSync))}">${timeAgo(r.lastSync)}</td>
                            <td class="p-3 font-mono">${formatSeconds(r.lag)}</td>
                        </tr>`).join('')
                    : '<tr><td colspan="6" class="p-6 text-center text-slate-400">No tables are being mirrored.</td></tr>';
            }
            show('tablesMirroringGridCard');
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load table mirroring status');
        }
    });
}
