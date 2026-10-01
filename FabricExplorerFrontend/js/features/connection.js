// Trang Connection: danh sách profile Entra ID / OAuth, kích hoạt, test, lưu.
//
// Luồng dữ liệu: loadConnections() (GET /connections + GET /connections/active) -> store.connections -> renderConnectionsGrid().
// Mọi thao tác ghi (save / update / activate) đều kết thúc bằng loadConnections() để UI luôn khớp backend.
import * as store from '../state/store.js';
import { closeModal, escapeHtml, showApiError, showToast } from '../core/ui.js';
import * as connectionsApi from '../api/connections.api.js';
import * as authApi from '../api/auth.api.js';

const MODAL_ID = 'modalEntraOAuth';
const MODAL_BUTTONS = ['btnOauthTest', 'btnOauthSave'];
const TOKEN_PATH_RE = /^\/([^/]+)\/oauth2\/(?:v2\.0\/)?token\/?$/i;

/* ───────────── helpers ───────────── */

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

/* ───────────── load + render ───────────── */

let loadSeq = 0;   // bỏ kết quả của lần gọi cũ nếu có lần gọi mới hơn (tránh ghi đè state bằng dữ liệu cũ)

/** Nạp danh sách + connection active từ backend rồi render. Gọi khi khởi động và mỗi lần vào tab Connection. */
export async function loadConnections() {
    const seq = ++loadSeq;
    try {
        const [list, active] = await Promise.all([connectionsApi.list(), connectionsApi.getActive()]);
        if (seq !== loadSeq) return;
        store.connections.allConnections = list;
        store.connections.activeConnection = active ?? list.find(c => c.isActive) ?? null;
    } catch (err) {
        if (seq !== loadSeq) return;
        showApiError(err, 'Could not load connections');
    }
    renderConnectionsGrid();
}

/** Render thuần từ store (không gọi mạng). */
export function renderConnectionsGrid() {
    const container = $('connectionsGridContainer');
    if (!container) return;

    const { allConnections: list } = store.connections;
    setText('connCountLabel', `${list.length} Saved Profile${list.length === 1 ? '' : 's'}`);
    renderActiveCard(store.connections.activeConnection);

    container.replaceChildren();
    if (!list.length) {
        container.innerHTML = `
            <div class="md:col-span-2 text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl p-6 text-center">
                No saved connections yet. Click <b>Add Connection</b> to create one.
            </div>`;
        return;
    }
    list.forEach(conn => container.appendChild(buildConnectionCard(conn)));
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

    // Badge môi trường chỉ hiện khi backend có trả `environment`; badge phiên chỉ hiện khi có connection active.
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

    // addEventListener thay vì onclick="..." để không phải nhúng id từ server vào chuỗi HTML.
    card.querySelector('[data-action="activate"]')?.addEventListener('click', () => setActiveConnection(conn.id));
    return card;
}

/* ───────────── activate ───────────── */

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

/* ───────────── modal: add / edit ───────────── */

/** isEdit = false: tạo mới; true: sửa connection đang active. */
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

    // Backend không trả secret: để trống khi sửa nghĩa là "giữ nguyên secret đã lưu".
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

/**
 * Đọc + kiểm tra form. Trả về payload, hoặc null (đã hiện toast cảnh báo) nếu dữ liệu chưa hợp lệ.
 * Gửi cả `tenantId` (tách từ endpoint) lẫn `tokenEndpoint` để tương thích với DTO của backend;
 * bỏ field thừa sau khi đã chốt contract. `clientSecret` bị bỏ khỏi payload khi để trống.
 */
function collectOauthForm() {
    const { isEdit } = store.connectionEditingState;
    const v = id => $(id)?.value?.trim() ?? '';
    const name = v('oauthConnName');
    const workspaceId = v('oauthWorkspaceId');
    const endpoint = v('oauthEndpoint');
    const clientId = v('oauthClientId');
    const clientSecret = v('oauthClientSecret');

    const missing = [];
    if (!name) missing.push('Connection Name');
    if (!workspaceId) missing.push('Workspace ID');
    if (!endpoint) missing.push('Token Endpoint');
    if (!clientId) missing.push('Client ID');
    if (!isEdit && !clientSecret) missing.push('Client Secret');
    if (missing.length) {
        showToast(`Please fill in: ${missing.join(', ')}`, 'warning');
        return null;
    }

    let tenantId = null;
    try { tenantId = new URL(endpoint).pathname.match(TOKEN_PATH_RE)?.[1] ?? null; } catch { /* URL không hợp lệ */ }
    if (!tenantId) {
        showToast('Token endpoint must look like https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token', 'warning');
        return null;
    }

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
                // Không có secret mới -> chỉ có thể kiểm tra bản đã lưu trên backend.
                await connectionsApi.testSaved(connId);
                showToast('Saved credentials verified. Re-enter the client secret to test your edits.', 'success');
            } else {
                await connectionsApi.test(payload);
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

        // Chưa có connection nào active (vd. vừa tạo cái đầu tiên) -> kích hoạt luôn, nếu không các trang khác không có workspace để dùng.
        if (!isEdit && !store.connections.activeConnection && saved?.id) {
            try {
                await connectionsApi.activate(saved.id);
                await loadConnections();
            } catch (err) { showApiError(err, 'Saved, but could not activate the new connection'); }
        }
        showToast('Connection saved successfully', 'success');
    });
}

/* ───────────── test / sign-out ───────────── */

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
