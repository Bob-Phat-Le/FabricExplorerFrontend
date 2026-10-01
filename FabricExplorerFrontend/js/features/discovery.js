// Trang Discovery: Lakehouse / Warehouse / Mirrored Database.
import * as store from '../state/store.js';
import { copyToClipboard, showApiError, showToast } from '../core/ui.js';
import * as discoveryApi from '../api/discovery.api.js';

let isConnStringVisible = false;

export function switchDiscoveryResource(resType) {
    ['lakehouse', 'warehouse', 'mirrored'].forEach(r => {
        const sub = document.getElementById(`disc-sub-${r}`);
        if (sub) sub.classList.add('hidden');
    });
    const activeSub = document.getElementById(`disc-sub-${resType}`);
    if (activeSub) activeSub.classList.remove('hidden');
}

export async function executeListTables() {
    try {
        const tables = await discoveryApi.listLakehouseTables(scope());
        document.getElementById('lakehouseGridContainer')?.classList.remove('hidden');
        showToast('Retrieved tables for Lakehouse', 'info');
        // TODO(api): render `tables` vào lưới #lakehouseGridContainer (hiện lưới vẫn là HTML tĩnh).
        return tables;
    } catch (err) { showApiError(err, 'Could not list tables'); }
}

export function inspectTable(tableName) {
    showToast(`Inspecting table ${tableName}`, 'info');
}

export function filterLakehouseGrid() {}

export async function executeGetWarehouse() {
    try {
        const wh = await discoveryApi.getWarehouse(scope());
        document.getElementById('warehouseDetailsCard')?.classList.remove('hidden');
        // TODO(api): đổ `wh` vào #warehouseDetailsCard.
        return wh;
    } catch (err) { showApiError(err, 'Could not load warehouse'); }
}

export async function executeGetConnString() {
    try {
        connString = (await discoveryApi.getWarehouseConnectionString(scope())).connectionString;
        isConnStringVisible = false;
        document.getElementById('connStringText').innerText = MASK;
        document.getElementById('btnToggleConnStr').innerText = 'Show';
        document.getElementById('connStringCard')?.classList.remove('hidden');
    } catch (err) { showApiError(err, 'Could not load connection string'); }
}

export function toggleConnStringVisibility() {
    const el = document.getElementById('connStringText');
    if (isConnStringVisible) {
        el.innerText = MASK;
        document.getElementById('btnToggleConnStr').innerText = 'Show';
    } else {
        el.innerText = connString;
        document.getElementById('btnToggleConnStr').innerText = 'Hide';
    }
    isConnStringVisible = !isConnStringVisible;
}

export function copyConnString() { copyToClipboard(connString, 'Connection string copied'); }

export async function executeGetMirroredDb() {
    try {
        const db = await discoveryApi.getMirroredDb(scope());
        document.getElementById('mirroredDbDetailsCard')?.classList.remove('hidden');
        // TODO(api): đổ `db` vào #mirroredDbDetailsCard.
        return db;
    } catch (err) { showApiError(err, 'Could not load mirrored database'); }
}

export async function executeGetMirroringStatus() {
    try {
        const status = await discoveryApi.getMirroringStatus(scope());
        document.getElementById('mirroringStatusCard')?.classList.remove('hidden');
        // TODO(api): đổ `status` vào #mirroringStatusCard.
        return status;
    } catch (err) { showApiError(err, 'Could not load mirroring status'); }
}

export async function openStartMirrorModal() {
    try {
        await discoveryApi.startMirroring(scope());
        showToast('Mirroring process started', 'success');
    } catch (err) { showApiError(err, 'Could not start mirroring'); }
}

export async function openStopMirrorModal() {
    try {
        await discoveryApi.stopMirroring(scope());
        showToast('Mirroring process stopped', 'warning');
    } catch (err) { showApiError(err, 'Could not stop mirroring'); }
}

export async function executeGetTablesMirroringStatus() {
    try {
        const rows = await discoveryApi.getTablesMirroringStatus(scope());
        document.getElementById('tablesMirroringGridCard')?.classList.remove('hidden');
        // TODO(api): render `rows` vào #tablesMirroringGridCard.
        return rows;
    } catch (err) { showApiError(err, 'Could not load table mirroring status'); }
}

const MASK = '••••••••••••••••••••••••••••••••••••••••';
let connString = '';

/** Query chung cho các lời gọi discovery: workspace của connection đang active. */
function scope() { return { workspaceId: store.connections.activeConnection?.workspaceId }; }
