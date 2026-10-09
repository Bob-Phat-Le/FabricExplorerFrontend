// Trang Discovery: Lakehouse / Warehouse / Mirrored Database.
//
// Luồng dữ liệu: connection đang active (store) -> nạp dropdown của resource đang xem (lazy, theo từng sub-view)
// -> người dùng chọn item -> bấm action -> gọi API -> render thẳng dữ liệu thật vào card/lưới.
import * as store from '../state/store.js';
import { copyToClipboard, escapeHtml, showApiError, showToast } from '../core/ui.js';
import { formatDateTime, formatNumber, formatSeconds, timeAgo } from '../core/format.js';
import { sleep } from '../api/client.js';
import * as discoveryApi from '../api/discovery.api.js';

/* ───────────── helpers ───────────── */

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
    return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${TONES[tone]}"${titleAttr}>● ${escapeHtml(label)}</span>`;
}

// Giá trị status do backend trả về (enum dạng chuỗi) -> màu hiển thị.
const TABLE_STATUS_TONE = { Healthy: 'ok', Empty: 'muted', Stale: 'warn', Error: 'bad', Unknown: 'muted' };
const ONLINE_STATUS_TONE = { Online: 'ok', Offline: 'bad', Unknown: 'muted' };
const DB_STATUS_TONE = { Active: 'ok', Offline: 'bad', Unknown: 'muted' };
const MIRRORING_STATUS_TONE = { Running: 'ok', Starting: 'info', Initializing: 'info', Stopping: 'warn', Stopped: 'muted', Paused: 'muted', Initialized: 'muted', Unknown: 'muted' };
const TABLE_MIRRORING_TONE = { Replicating: 'ok', Snapshotting: 'info', Reseeding: 'info', Initialized: 'info', Stopped: 'muted', Failed: 'bad', Unknown: 'muted' };

/**
 * Mỗi `key` chỉ có một request "hiện hành". Request mới (hoặc người dùng đổi lựa chọn) sẽ:
 *  - hủy request cũ qua AbortSignal -> trình duyệt ngắt kết nối nên backend dừng công việc đang làm;
 *  - làm `isCurrent()` của request cũ trả false -> kết quả muộn bị bỏ, không ghi đè giao diện.
 * Dùng `isCurrent.signal` để truyền vào API call.
 */
const seqs = {};
const ctrls = {};
function latest(key) {
    ctrls[key]?.abort();
    const ctrl = (ctrls[key] = new AbortController());
    const n = (seqs[key] = (seqs[key] || 0) + 1);
    const isCurrent = () => seqs[key] === n;
    isCurrent.signal = ctrl.signal;
    return isCurrent;
}
const invalidate = (...keys) => keys.forEach(k => { seqs[k] = (seqs[k] || 0) + 1; ctrls[k]?.abort(); });

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

/**
 * Connection đang active chỉ dùng để xác thực (X-Connection-Id -> tenant / client id / secret).
 * Workspace không lấy từ connection mà từ mỗi item được chọn trong dropdown.
 */
function context() {
    const conn = store.connections.activeConnection;
    return conn ? { connectionId: conn.id } : null;
}

function requireContext() {
    const ctx = context();
    if (!ctx) showToast('Set an active connection first (Connection tab).', 'warning');
    return ctx;
}

/* ───────────── resource switcher + dropdowns ───────────── */

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
const loadedFor = {};          // resource -> connectionId đã nạp dropdown
const workspaceCache = {};     // connectionId -> Promise<workspace[]> (dùng chung cho 3 dropdown)
const WORKSPACE_FETCH_CONCURRENCY = 4;
const listSeq = {};            // resource -> số thứ tự lần nạp dropdown gần nhất
const lists = {};              // resource -> item đã nạp (mỗi item mang workspaceId của nó)
const listCtrl = {};           // resource -> AbortController của lần nạp dropdown đang chạy

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

/** Gọi khi vào tab Discovery: connection active có thể đã đổi nên nạp lại dropdown nếu cần. */
export function loadDiscoveryResources() {
    return ensureLoaded(currentResource);
}

export function reloadDiscoveryList(resType) {
    return ensureLoaded(resType, { force: true });
}

/** Đổi lựa chọn trong dropdown: kết quả cũ không còn đúng nữa nên ẩn đi và huỷ request đang chạy. */
export function onDiscoverySelectionChange(resType) {
    clearResults(resType);
}

function clearResults(resType) {
    const cfg = RESOURCES[resType];
    invalidate(...cfg.seqKeys);
    cfg.resultCards.forEach(hide);
    if (resType === 'warehouse') resetConnString();
    if (resType === 'lakehouse') { lakeTables = []; lakeNextToken = null; lakeSelection = null; }
}

function setPlaceholder(resType, text) {
    const select = $(RESOURCES[resType].selectId);
    if (!select) return;
    select.replaceChildren(new Option(text, ''));
    select.disabled = true;
}

async function ensureLoaded(resType, { force = false } = {}) {
    const cfg = RESOURCES[resType];
    const ctx = context();
    if (!ctx) {
        loadedFor[resType] = null;
        clearResults(resType);
        setPlaceholder(resType, 'No active connection — set one in the Connection tab');
        return;
    }

    const key = ctx.connectionId;
    if (!force && loadedFor[resType] === key) return;
    if (force) delete workspaceCache[key];

    // Nạp lại thì hủy lần nạp cũ (các request list theo workspace đang bay sẽ bị ngắt ở backend)
    listCtrl[resType]?.abort();
    const ctrl = (listCtrl[resType] = new AbortController());
    const seq = (listSeq[resType] = (listSeq[resType] || 0) + 1);
    clearResults(resType);
    setPlaceholder(resType, 'Loading…');
    try {
        // force (nút Reload) = bỏ qua cache của backend cho cả danh sách workspace lẫn danh sách item
        const { items, skipped } = await fetchFromAllWorkspaces(cfg, ctx, { refresh: force, signal: ctrl.signal });
        if (seq !== listSeq[resType]) return;
        lists[resType] = items;
        loadedFor[resType] = key;

        const select = $(cfg.selectId);
        if (skipped) showToast(`${skipped} workspace${skipped === 1 ? '' : 's'} could not be read and ${skipped === 1 ? 'was' : 'were'} skipped.`, 'warning');
        if (!items.length) {
            setPlaceholder(resType, `No ${cfg.noun}s found in your workspaces`);
            return;
        }
        select.replaceChildren(...items.map(item =>
            new Option(`${cfg.nameOf(item)} (${item.workspaceName ?? 'Workspace'})`, cfg.idOf(item))));
        select.disabled = false;
    } catch (err) {
        if (seq !== listSeq[resType]) return;
        loadedFor[resType] = null;
        setPlaceholder(resType, `Could not load ${cfg.noun}s — click Reload`);
        showApiError(err, `Could not load ${cfg.noun}s`);
    }
}

/** Workspace của connection; cache theo connection để 3 dropdown không gọi lại. */
function getWorkspaces(ctx, refresh = false) {
    // Không gắn signal: promise này được dùng chung bởi cả 3 dropdown, hủy một lần nạp không được làm hỏng các lần khác
    workspaceCache[ctx.connectionId] ||= discoveryApi.listWorkspaces({ ...ctx, refresh }).then(list => list ?? []);
    return workspaceCache[ctx.connectionId].catch(err => { delete workspaceCache[ctx.connectionId]; throw err; });
}

/**
 * Lấy danh sách workspace, rồi gọi endpoint list của resource cho TỪNG workspace (giới hạn song song) và gộp lại.
 * Workspace nào lỗi thì bỏ qua và đếm vào `skipped`; chỉ báo lỗi khi tất cả đều lỗi.
 */
async function fetchFromAllWorkspaces(cfg, ctx, { refresh = false, signal } = {}) {
    const workspaces = await getWorkspaces(ctx, refresh);
    const results = new Array(workspaces.length);
    let next = 0;

    async function worker() {
        while (next < workspaces.length && !signal?.aborted) {
            const i = next++;
            try {
                const items = (await cfg.fetch({ ...ctx, workspaceId: workspaces[i].workspaceId, refresh, signal })) ?? [];
                // Backend đã trả workspaceName; điền thêm từ danh sách workspace phòng khi thiếu.
                results[i] = { ok: true, items: items.map(it => ({ ...it, workspaceId: it.workspaceId ?? workspaces[i].workspaceId, workspaceName: it.workspaceName ?? workspaces[i].workspaceName })) };
            } catch (err) {
                console.warn(`Could not list ${cfg.noun}s in workspace ${workspaces[i].workspaceId}`, err);
                results[i] = { ok: false, err };
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(WORKSPACE_FETCH_CONCURRENCY, workspaces.length) }, worker));
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');   // bị thay bằng lần nạp mới hơn

    const failed = results.filter(r => !r.ok);
    if (workspaces.length && failed.length === workspaces.length) throw failed[0].err;

    const items = results.filter(r => r.ok).flatMap(r => r.items)
        .sort((a, b) => cfg.nameOf(a).localeCompare(cfg.nameOf(b), undefined, { sensitivity: 'base' })
            || String(a.workspaceName).localeCompare(String(b.workspaceName)));
    return { items, skipped: failed.length };
}

/** Item đang chọn trong dropdown (kèm workspaceId của nó), hoặc null + toast nhắc chọn. */
function selectedItem(resType) {
    const cfg = RESOURCES[resType];
    const id = $(cfg.selectId)?.value;
    const item = id ? (lists[resType] ?? []).find(i => cfg.idOf(i) === id) : null;
    if (!item) showToast(`Select a ${cfg.noun} first.`, 'warning');
    return item ?? null;
}

/* ───────────── Lakehouse ───────────── */

let lakeTables = [];
let lakeNextToken = null;
let lakeSelection = null;   // { workspaceId, lakehouseId } của lần List Tables gần nhất (dùng cho Load more)

export function executeListTables() { return loadTables({ append: false }); }

/** Nút Refresh trong lưới: bỏ qua cache thống kê bảng của backend và tính lại. */
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
            if (!append) showToast(`Retrieved ${lakeTables.length}${lakeNextToken ? '+' : ''} table${lakeTables.length === 1 ? '' : 's'} for Lakehouse`, 'info');
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not list tables');
        }
    });
}

export function filterLakehouseGrid() { renderLakehouseGrid(); }

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
                <td class="p-3 font-mono">${formatNumber(t.rowCount)}</td>
                <td class="p-3 text-slate-500" title="${escapeHtml(formatDateTime(t.lastModifiedTime))}">${timeAgo(t.lastModifiedTime)}</td>
                <td class="p-3">${badge(t.status || 'Unknown', TABLE_STATUS_TONE[t.status] ?? 'muted', t.statusMessage ?? '')}</td>
                <td class="p-3 text-right pr-4"><button type="button" data-table="${escapeHtml(t.name)}" class="text-indigo-600 font-semibold hover:underline">View</button></td>
            </tr>`).join('');
        tbody.querySelectorAll('button[data-table]').forEach(b => b.addEventListener('click', () => inspectTable(b.dataset.table)));
    }

    setText('lakehouseGridSummary', `Showing ${rows.length} of ${lakeTables.length} loaded table${lakeTables.length === 1 ? '' : 's'}${lakeNextToken ? ' (more available)' : ''}`);
    $('btnLakeLoadMore')?.classList.toggle('hidden', !lakeNextToken);
}

/* ───────────── Warehouse ───────────── */

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
            const wh = await discoveryApi.getWarehouse({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;

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
            show('warehouseDetailsCard');
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load warehouse');
        }
    });
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

/** Không giữ connection string trong bộ nhớ/DOM khi đã đổi sang warehouse khác. */
function resetConnString() {
    connString = '';
    isConnStringVisible = false;
    setText('connStringText', MASK);
    setText('btnToggleConnStr', 'Show');
}

/* ───────────── Mirrored Database ───────────── */

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
            const db = await discoveryApi.getMirroredDb({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;

            setText('mdbName', db.mirroredDatabaseName ?? EMPTY);
            setText('mdbWorkspace', db.workspaceName ?? EMPTY);
            setHtml('mdbStatus', badge(db.status ?? 'Unknown', DB_STATUS_TONE[db.status] ?? 'muted', `Mirroring status: ${db.mirroringStatus ?? 'Unknown'}`)
                + `<span class="ml-1.5 text-[11px] font-normal text-slate-400">${escapeHtml(db.mirroringStatus ?? '')}</span>`);
            setText('mdbSource', [db.sourceName, db.sourceType && db.sourceType !== db.sourceName ? `(${db.sourceType})` : '']
                .filter(Boolean).join(' ') || EMPTY);
            // Fabric không cung cấp ngày tạo cho mirrored database nên backend trả null.
            setText('mdbCreated', db.createdAt ? formatDateTime(db.createdAt) : 'Not available');
            show('mirroredDbDetailsCard');
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load mirrored database');
        }
    });
}

export async function executeGetMirroringStatus() {
    const ctx = requireContext();
    const item = ctx && selectedItem('mirrored');
    if (!item) return;
    const target = { ...ctx, workspaceId: item.workspaceId, mirroredDatabaseId: item.mirroredDatabaseId };

    const isCurrent = latest('mirroringStatus');
    await withBusy('btnGetMirroringStatus', async () => {
        try {
            const status = await discoveryApi.getMirroringStatus({ ...target, signal: isCurrent.signal });
            if (isCurrent()) renderMirroringStatus(status);
        } catch (err) {
            if (isCurrent()) showApiError(err, 'Could not load mirroring status');
        }
    });
}

function renderMirroringStatus(status) {
    setHtml('mirroringStatusBadge', badge(status.status ?? 'Unknown', MIRRORING_STATUS_TONE[status.status] ?? 'muted'));
    setText('msLastSync', status.lastSynchronization ? timeAgo(status.lastSynchronization) : EMPTY);
    $('msLastSync')?.setAttribute('title', formatDateTime(status.lastSynchronization));
    setText('msRecords', formatNumber(status.recordSynchronized));
    setText('msLatency', status.currentLatency === null || status.currentLatency === undefined ? EMPTY : formatSeconds(status.currentLatency));
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
            // Start/Stop là thao tác thay đổi trạng thái: không gắn signal (backend cũng không hủy giữa chừng)
            const result = await api(target);
            if (!isCurrent()) return;
            showToast(escapeHtml(result?.message || (isStart ? 'Mirroring process started' : 'Mirroring process stopped')), isStart ? 'success' : 'warning');
        } catch (err) {
            if (isCurrent()) showApiError(err, isStart ? 'Could not start mirroring' : 'Could not stop mirroring');
            return;
        }
        // Fabric chuyển trạng thái bất đồng bộ (Starting -> Running, Stopping -> Stopped): theo dõi để card luôn đúng.
        followMirroringStatus(target, isStart ? ['Running'] : ['Stopped']);
    });
}

/** Poll status sau start/stop đến khi đạt trạng thái đích (tối đa ~1 phút); đổi lựa chọn sẽ dừng. */
async function followMirroringStatus(target, targets) {
    const isCurrent = latest('statusFollow');
    for (let i = 0; i < STATUS_POLL_MAX; i++) {
        await sleep(STATUS_POLL_MS);
        if (!isCurrent()) return;
        try {
            const status = await discoveryApi.getMirroringStatus({ ...target, signal: isCurrent.signal });
            if (!isCurrent()) return;
            renderMirroringStatus(status);
            if (targets.includes(status.status)) return;
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
