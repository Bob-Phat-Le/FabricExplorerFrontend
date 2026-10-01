// Trang Job Instances: chọn item, bảng job, drawer chi tiết, phân trang.
import { fabricItems, jobInstancesData, replaceContents } from '../state/store.js';
import * as store from '../state/store.js';
import { showApiError, showToast } from '../core/ui.js';
import * as itemsApi from '../api/items.api.js';

let activeMonitoredItem = null;

export async function toggleItemSelectorDropdown() {
    document.getElementById('itemSelectorMenu')?.classList.toggle('hidden');
    try { await loadItems(); } catch (err) { showApiError(err, 'Could not load items'); }
    renderItemsList();
}

export function renderItemsList() {
    const container = document.getElementById('itemsListContainer');
    if (!container) return;
    container.innerHTML = '';

    store.fabricItems.forEach(item => {
        const row = document.createElement('div');
        row.className = "p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-all flex items-center justify-between text-xs";
        row.onclick = () => selectMonitoredItem(item.id);

        row.innerHTML = `
            <div>
                <div class="font-bold text-slate-900">${item.name}</div>
                <div class="text-[10px] text-slate-400 font-mono">${item.id.substring(0, 8)}...</div>
            </div>
            <span class="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">${item.type}</span>
        `;
        container.appendChild(row);
    });
}

export async function selectMonitoredItem(itemId) {
    const target = fabricItems.find(i => i.id === itemId);
    if (!target) return;

    activeMonitoredItem = target;
    document.getElementById('itemSelectorMenu')?.classList.add('hidden');
    await loadJobs();
    renderJobInstancesUI();
    showToast(`Monitoring item "${target.name}"`, 'success');
}

export function renderJobInstancesUI() {
    const setup = document.getElementById('monitoredItemSetup');
    const active = document.getElementById('monitoredItemActive');

    if (!activeMonitoredItem) {
        if (setup) setup.classList.remove('hidden');
        if (active) active.classList.add('hidden');
        renderJobInstancesTable([]);
        return;
    }

    if (setup) setup.classList.add('hidden');
    if (active) active.classList.remove('hidden');

    if (document.getElementById('monitoredItemName')) document.getElementById('monitoredItemName').innerText = activeMonitoredItem.name;
    if (document.getElementById('monitoredItemType')) document.getElementById('monitoredItemType').innerText = activeMonitoredItem.type;
    if (document.getElementById('monitoredItemId')) document.getElementById('monitoredItemId').innerText = activeMonitoredItem.id;

    renderJobInstancesTable(store.jobInstancesData);
}

export function renderJobInstancesTable(data) {
    const tbody = document.getElementById('jobTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-8 text-center text-slate-400">
                    <i class="fa-solid fa-clock-rotate-left text-2xl mb-2 block"></i>
                    <span>No job instances available for this item.</span>
                </td>
            </tr>
        `;
        updateJobStats(0, 0, 0, 0, 0);
        return;
    }

    let loaded = data.length, inProg = 0, comp = 0, fail = 0, oth = 0;

    data.forEach(job => {
        if (job.status === 'InProgress') inProg++;
        else if (job.status === 'Completed') comp++;
        else if (job.status === 'Failed') fail++;
        else oth++;

        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50";

        const badge = job.status === 'Completed' ? '<span class="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold">● Completed</span>' :
                     (job.status === 'InProgress' ? '<span class="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-semibold">● In Progress</span>' :
                     (job.status === 'Failed' ? '<span class="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold">✕ Failed</span>' :
                     '<span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-semibold">Deduped</span>'));

        tr.innerHTML = `
            <td class="p-3 pl-4">${badge}</td>
            <td class="p-3 font-mono text-slate-900 font-semibold">${job.jobType}</td>
            <td class="p-3">${job.invokeType}</td>
            <td class="p-3 text-slate-500">${new Date(job.startTime).toLocaleTimeString()}</td>
            <td class="p-3 text-slate-500">${job.endTime ? new Date(job.endTime).toLocaleTimeString() : '—'}</td>
            <td class="p-3 font-mono text-indigo-600 font-semibold">01m 45s</td>
            <td class="p-3 font-mono text-slate-400">${job.id.substring(0, 8)}...</td>
            <td class="p-3 text-right pr-4">
                <button onclick="inspectJobDetails('${job.id}')" class="text-indigo-600 font-semibold hover:underline">View Details</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    updateJobStats(loaded, inProg, comp, fail, oth);
}

export function updateJobStats(loaded, inProg, comp, fail, oth) {
    if (document.getElementById('statLoaded')) document.getElementById('statLoaded').innerText = loaded;
    if (document.getElementById('statInProgress')) document.getElementById('statInProgress').innerText = inProg;
    if (document.getElementById('statCompleted')) document.getElementById('statCompleted').innerText = comp;
    if (document.getElementById('statFailed')) document.getElementById('statFailed').innerText = fail;
    if (document.getElementById('statOther')) document.getElementById('statOther').innerText = oth;
}

export function inspectJobDetails(id) {
    const job = jobInstancesData.find(j => j.id === id);
    if (!job) return;

    document.getElementById('dtlJobType').innerText = job.jobType;
    document.getElementById('dtlInstanceId').innerText = job.id;
    document.getElementById('dtlFullInstanceId').innerText = job.id;
    document.getElementById('dtlRootActivityId').innerText = job.rootActivityId;

    const failPanel = document.getElementById('dtlFailurePanel');
    if (job.status === 'Failed') {
        failPanel?.classList.remove('hidden');
        if (document.getElementById('dtlErrorMsg')) document.getElementById('dtlErrorMsg').innerText = job.errorMsg || 'Pipeline execution failed.';
    } else {
        failPanel?.classList.add('hidden');
    }

    document.getElementById('drawerJobDetails')?.classList.remove('hidden');
}

export async function refreshJobInstancesData() {
    if (!activeMonitoredItem) return showToast('Select an item to monitor first', 'warning');
    await loadJobs();
    renderJobInstancesUI();
    showToast('Refreshed job instances logs', 'info');
}

export function toggleApiDetailsPanel() {
    document.getElementById('apiDetailsPanel')?.classList.toggle('hidden');
}

export function filterJobInstancesTable() {}

export function filterItemList() {}

export function filterItemType() {}

export function handleAutoRefreshChange() {}

export async function loadNextJobsPage() {
    if (!activeMonitoredItem || !nextJobsToken) return showToast('No more job instances', 'info');
    try {
        const page = await itemsApi.listJobs(activeMonitoredItem.id, { continuationToken: nextJobsToken });
        jobInstancesData.push(...page.items);
        nextJobsToken = page.continuationToken || null;
        renderJobInstancesUI();
        showToast('Loaded additional job instances records', 'info');
    } catch (err) { showApiError(err, 'Could not load more jobs'); }
}

let itemsLoaded = false;
let nextJobsToken = null;   // continuation token của trang job kế tiếp

/** Nạp danh sách Fabric item (cache sau lần đầu; truyền force để nạp lại). */
export async function loadItems({ force = false } = {}) {
    if (itemsLoaded && !force) return;
    store.replaceContents(store.fabricItems, await itemsApi.list());
    itemsLoaded = true;
}

/** Nạp trang job đầu tiên của item đang theo dõi (thay thế nội dung cũ). */
async function loadJobs() {
    try {
        const page = await itemsApi.listJobs(activeMonitoredItem.id, {});
        store.replaceContents(store.jobInstancesData, page.items);
        store.nextJobsToken = page.continuationToken || null;
    } catch (err) { showApiError(err, 'Could not load job instances'); }
}
