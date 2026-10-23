import * as store from '../state/store.js';
import { closeModal, escapeHtml, showApiError, showToast } from '../core/ui.js';
import * as connectionsApi from '../api/connections.api.js';
import * as authApi from '../api/auth.api.js';

const MODAL_ID = 'modalEntraOAuth';
const MODAL_BUTTONS = ['btnOauthTest', 'btnOauthSave'];
const TOKEN_PATH_RE = /^\/([^/]+)\/oauth2\/(?:v2\.0\/)?token\/?$/i;

const $ = id => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el) el.innerText = text; };
const isActive = conn => !!conn && conn.id === store.connections.activeConnection?.id;
const tokenEndpointOf = conn =>
    conn?.tokenEndpoint || (conn?.tenantId ? `https://login.microsoftonline.com/${conn.tenantId}/oauth2/v2.0/token` : '');

async function withBusy(ids, fn) {
    const buttons = ids.map($).filter(Boolean);
    const set = busy => buttons.forEach(b => {
        b.disabled = busy;
        b.classList.toggle('opacity-60', busy);
        b.classList.toggle('cursor-not-allowed', busy);
    });
    set(true);
    try { await fn(); } finally { set(false); }
}

const clampPageSize = raw => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < 1) return store.CONN_PAGE_SIZE_DEFAULT;
    return Math.min(n, store.CONN_PAGE_SIZE_MAX);
};

const totalPages = () => Math.max(1, store.connectionsPaging.totalPages);

function pageWindow(current, total, size = 5) {
    let start = Math.max(1, current - Math.floor(size / 2));
    let end = Math.min(total, start + size - 1);
    start = Math.max(1, end - size + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

let loadSeq = 0;

export async function loadConnections() {
    const seq = ++loadSeq;
    const paging = store.connectionsPaging;
    try {
        const [res, active] = await Promise.all([
            connectionsApi.listPage({ page: paging.page, pageSize: paging.pageSize }),
            connectionsApi.getActive()
        ]);
        if (seq !== loadSeq) return;

        paging.page = res.page;
        paging.pageSize = res.pageSize;
        paging.total = res.totalItems;
        paging.totalPages = res.totalPages;

        if (!res.items.length && res.totalItems > 0 && paging.page > res.totalPages) {
            paging.page = res.totalPages;
            return loadConnections();
        }

        store.connections.allConnections = res.items;
        store.connections.activeConnection = active ?? res.items.find(c => c.isActive) ?? null;
    } catch (err) {
        if (seq !== loadSeq) return;
        showApiError(err, 'Could not load connections');
    }
    renderConnectionsGrid();
}

export function renderConnectionsGrid() {
    const sizeInput = $('connPageSize');
    if (sizeInput && document.activeElement !== sizeInput) {
        sizeInput.value = store.connectionsPaging.pageSize;
    }

    const container = $('connectionsGridContainer');
    if (!container) return;

    const { allConnections: list } = store.connections;
    const { total } = store.connectionsPaging;
    setText('connCountLabel', `${total} Saved Profile${total === 1 ? '' : 's'}`);
    renderActiveCard(store.connections.activeConnection);

    container.replaceChildren();
    if (!list.length) {
        container.innerHTML = `
            <div class="md:col-span-2 text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl p-6 text-center">
                No saved connections yet. Click <b>Add Connection</b> to create one.
            </div>`;
    } else {
        list.forEach(conn => container.appendChild(buildConnectionCard(conn)));
    }
    renderPagination();
}

function renderActiveCard(active) {
    setText('displayActiveConnTitle', active?.name ?? 'No active connection');
    setText('cardWsName', active ? (active.workspaceName || active.workspaceId || '—') : '—');
    setText('cardWsId', active?.workspaceId ?? '—');
    setText('cardClientId', active?.clientId ?? '—');

    const endpoint = tokenEndpointOf(active);
    setText('cardTokenEndpoint', endpoint ? endpoint.replace(/^https?:\/\//, '') : '—');
    const endpointEl = $('cardTokenEndpoint');
    if (endpointEl) endpointEl.title = endpoint;

    const envBadge = $('displayActiveEnvBadge');
    if (envBadge) {
        envBadge.innerText = active?.environment ?? '';
        envBadge.classList.toggle('hidden', !active?.environment);
    }
    $('connStatusBadge')?.classList.toggle('hidden', !active);
}

function buildConnectionCard(conn) {
    const active = isActive(conn);
    const card = document.createElement('div');
    card.className = `p-4 rounded-xl border transition-all ${active
        ? 'bg-indigo-50/40 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}`;

    card.innerHTML = `
        <div class="flex items-start justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-lg ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'} flex items-center justify-center text-sm font-bold shadow-sm shrink-0">
                    <i class="fa-solid ${active ? 'fa-plug-circle-check' : 'fa-plug'}"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-900 text-xs">${escapeHtml(conn.name)}</h4>
                    <p class="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]">${escapeHtml(conn.workspaceName || conn.workspaceId)}</p>
                </div>
            </div>
            ${active
                ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">Active</span>'
                : '<button type="button" data-action="activate" class="px-2.5 py-1 bg-white border border-slate-200 hover:border-indigo-400 text-slate-600 text-[11px] font-semibold rounded-lg">Set Active</button>'}
        </div>`;

    card.querySelector('[data-action="activate"]')?.addEventListener('click', () => setActiveConnection(conn.id));
    return card;
}

export async function setActiveConnection(connId) {
    try {
        await connectionsApi.activate(connId);
    } catch (err) {
        return showApiError(err, 'Could not switch connection');
    }
    await loadConnections();
    const name = store.connections.activeConnection?.name;
    showToast(name ? `Switched active connection to "${escapeHtml(name)}"` : 'Active connection switched', 'success');
}

export async function openEntraOAuthModal(isEdit = false) {
    const modal = $(MODAL_ID);
    if (!modal) return;

    let conn = null;
    if (isEdit) {
        try {
            conn = await connectionsApi.getActive();
        } catch (err) {
            return showApiError(err, 'Could not load active connection');
        }
        if (!conn) return showToast('No active connection', 'warning');
    }

    store.connectionEditingState.isEdit = isEdit;
    store.connectionEditingState.connId = conn?.id ?? null;

    $('oauthConnName').value = conn?.name ?? '';
    $('oauthWorkspaceId').value = conn?.workspaceId ?? '';
    $('oauthEndpoint').value = tokenEndpointOf(conn);
    $('oauthClientId').value = conn?.clientId ?? '';

    const secret = $('oauthClientSecret');
    secret.value = '';
    secret.placeholder = isEdit ? 'Leave blank to keep the current secret' : '';
    $('oauthSecretRequired')?.classList.toggle('hidden', isEdit);

    setText('sumWsName', conn ? (conn.workspaceName || conn.workspaceId || '-') : '-');
    updateOauthSummaryPanel();
    modal.classList.remove('hidden');
}

export function updateOauthSummaryPanel() {
    setText('sumName', $('oauthConnName')?.value || 'New Connection');
}

export function handleWsIdInput() {}

function collectOauthForm() {
    const { isEdit } = store.connectionEditingState;
    const v = id => $(id)?.value?.trim() ?? '';
    const isGuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    const name = v('oauthConnName');
    const workspaceId = v('oauthWorkspaceId');
    const endpoint = v('oauthEndpoint');
    const clientId = v('oauthClientId');
    const clientSecret = v('oauthClientSecret');

    const missing = [
        !name && 'Connection Name',
        !workspaceId && 'Workspace ID',
        !endpoint && 'Token Endpoint',
        !clientId && 'Client ID',
        !isEdit && !clientSecret && 'Client Secret'
    ].filter(Boolean);

    if (missing.length) {
        showToast(`Please fill in: ${missing.join(', ')}`, 'warning');
        return null;
    }

    if (!isGuid(workspaceId))
        return showToast('Workspace ID must be a valid GUID.', 'warning'), null;

    if (!isGuid(clientId))
        return showToast('Client ID must be a valid GUID.', 'warning'), null;

    let tenantId = null;
    try {
        tenantId = new URL(endpoint).pathname.match(TOKEN_PATH_RE)?.[1];
    } catch { }

    if (!tenantId)
        return showToast('Token endpoint must look like https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token', 'warning'), null;

    if (!isGuid(tenantId))
        return showToast('Tenant ID in the token endpoint must be a valid GUID.', 'warning'), null;

    const payload = { name, workspaceId, tenantId, tokenEndpoint: endpoint, clientId };
    if (clientSecret) payload.clientSecret = clientSecret;
    return payload;
}

export async function executeOauthConnectionTest() {
    const payload = collectOauthForm();
    if (!payload) return;
    const { isEdit, connId } = store.connectionEditingState;

    await withBusy(MODAL_BUTTONS, async () => {
        try {
            if (isEdit && !payload.clientSecret) {
                await connectionsApi.testSaved(connId);
                showToast('Saved credentials verified. Re-enter the client secret to test your edits.', 'success');
            } else {
                await connectionsApi.test({...payload, isProtected: false});
                showToast('OAuth 2.0 & Workspace access verified', 'success');
            }
        } catch (err) { showApiError(err, 'Connection test failed'); }
    });
}

export async function saveOauthConnectionModal() {
    const payload = collectOauthForm();
    if (!payload) return;
    const { isEdit, connId } = store.connectionEditingState;

    await withBusy(MODAL_BUTTONS, async () => {
        let saved;
        try {
            saved = isEdit ? await connectionsApi.update(connId, payload) : await connectionsApi.save(payload);
        } catch (err) {
            return showApiError(err, 'Could not save connection');
        }

        closeModal(MODAL_ID);
        await loadConnections();

        if (!isEdit && !store.connections.activeConnection && saved?.id) {
            try {
                await connectionsApi.activate(saved.id);
                await loadConnections();
            } catch (err) { showApiError(err, 'Saved, but could not activate the new connection'); }
        }
        showToast('Connection saved successfully', 'success');
    });
}

export async function testSavedConnection() {
    const conn = store.connections.activeConnection;
    if (!conn) return showToast('No active connection', 'warning');
    try {
        await connectionsApi.testSaved(conn.id);
        showToast('Active connection check succeeded', 'success');
    } catch (err) { showApiError(err, 'Active connection check failed'); }
}

export async function disconnectEntraID() {
    try {
        await authApi.logout();
        showToast('Signed out of Entra ID session', 'warning');
    } catch (err) { showApiError(err, 'Sign out failed'); }
}

function renderPagination() {
    const wrap = $('connPagination');
    const buttons = $('connPageButtons');
    if (!wrap || !buttons) return;

    const { page, pageSize, total } = store.connectionsPaging;
    const pages = totalPages();
    const count = store.connections.allConnections.length;

    wrap.classList.toggle('hidden', total === 0);
    const from = count ? (page - 1) * pageSize + 1 : 0;
    const to = count ? from + count - 1 : 0;
    setText('connPageInfo', `Showing ${from}–${to} of ${total} · Page ${page} / ${pages}`);

    const base = 'min-w-[28px] h-7 px-2 text-xs font-semibold rounded-lg border transition-colors';
    const mk = (label, target, { disabled = false, current = false, title = '' } = {}) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = label;
        b.title = title;
        b.disabled = disabled;
        b.className = `${base} ${current
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`;
        if (!disabled && !current) b.addEventListener('click', () => goToConnectionPage(target));
        return b;
    };
    const icon = name => `<i class="fa-solid ${name} text-[10px]"></i>`;

    buttons.replaceChildren(
        mk(icon('fa-angles-left'), 1, { disabled: page <= 1, title: 'First page' }),
        mk(icon('fa-chevron-left'), page - 1, { disabled: page <= 1, title: 'Previous page' }),
        ...pageWindow(page, pages).map(p => mk(String(p), p, { current: p === page, title: `Page ${p}` })),
        mk(icon('fa-chevron-right'), page + 1, { disabled: page >= pages, title: 'Next page' }),
        mk(icon('fa-angles-right'), pages, { disabled: page >= pages, title: 'Last page' })
    );
}

export async function goToConnectionPage(page) {
    const target = Math.min(Math.max(1, page), totalPages());
    if (target === store.connectionsPaging.page) return;
    store.connectionsPaging.page = target;
    await loadConnections();
}

export async function refreshConnections() {
    const input = $('connPageSize');
    const paging = store.connectionsPaging;

    const raw = input?.value;
    const size = clampPageSize(raw);
    if (input) input.value = size;
    if (String(size) !== String(raw).trim()) {
        showToast(`Page size must be between 1 and ${store.CONN_PAGE_SIZE_MAX}`, 'warning');
    }

    if (size !== paging.pageSize) {
        paging.pageSize = size;
        paging.page = 1;
    }

    await withBusy(['btnConnRefresh'], async () => {
        $('connRefreshIcon')?.classList.add('fa-spin');
        try { await loadConnections(); }
        finally { $('connRefreshIcon')?.classList.remove('fa-spin'); }
    });
}