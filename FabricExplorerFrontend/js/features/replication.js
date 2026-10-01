// Trang Replication: wizard 6 bước Open Mirroring (PK, payload, row marker).
import { replState } from '../state/store.js';
import { showApiError, showToast } from '../core/ui.js';
import * as replicationApi from '../api/replication.api.js';

let replCurrentStep = 1;

export function goToReplStep(stepNum) {
    replCurrentStep = stepNum;
    for (let i = 1; i <= 6; i++) {
        const card = document.getElementById(`repl-wizard-step-${i}`);
        if (card) card.classList.add('hidden');

        const badge = document.getElementById(`repl-step-badge-${i}`);
        const title = document.getElementById(`repl-step-title-${i}`);

        if (badge && title) {
            if (i < replCurrentStep) {
                badge.className = "w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm";
                badge.innerHTML = '<i class="fa-solid fa-check"></i>';
                title.className = "font-semibold text-slate-700";
            } else if (i === replCurrentStep) {
                badge.className = "w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm";
                badge.innerText = i;
                title.className = "font-bold text-indigo-600";
            } else {
                badge.className = "w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-500 font-bold flex items-center justify-center text-xs";
                badge.innerText = i;
                title.className = "font-semibold text-slate-400";
            }
        }
    }
    document.getElementById(`repl-wizard-step-${stepNum}`)?.classList.remove('hidden');
    updateReplReviewSummary();
}

export function prevReplStep() { if (replCurrentStep > 1) goToReplStep(replCurrentStep - 1); }

export function nextReplStep() { if (replCurrentStep < 6) goToReplStep(replCurrentStep + 1); }

export function resetReplForm() {
    goToReplStep(1);
    showToast('Replication wizard reset', 'info');
}

export function setReplDb(val) {
    replState.database = val;
    if (document.getElementById('replDbInfoName')) document.getElementById('replDbInfoName').innerText = val;
    updateReplReviewSummary();
}

export function setReplSchema(val) {
    replState.schema = val;
    updateReplReviewSummary();
}

export function setReplTable(val) {
    replState.table = val;
    const warn = document.getElementById('replExistingWarning');
    if (warn) {
        if (val === 'Customers') warn.classList.remove('hidden');
        else warn.classList.add('hidden');
    }
    updateReplReviewSummary();
}

export function toggleReplMetadata() {
    const isChecked = document.getElementById('replMetadataToggle')?.checked;
    replState.autoMetadata = isChecked;
    const sec = document.getElementById('replPkSection');
    const notice = document.getElementById('replMetadataOffNotice');

    if (isChecked) {
        sec?.classList.remove('hidden');
        notice?.classList.add('hidden');
    } else {
        sec?.classList.add('hidden');
        notice?.classList.remove('hidden');
    }
    updateReplReviewSummary();
}

export function togglePkDropdown() {
    document.getElementById('pkDropdownMenu')?.classList.toggle('hidden');
}

export function toggleReplPk(col) {
    const idx = replState.primaryKeys.indexOf(col);
    const checkIcon = document.getElementById(`pkCheck-${col}`);

    if (idx > -1) {
        replState.primaryKeys.splice(idx, 1);
        checkIcon?.classList.add('hidden');
    } else {
        replState.primaryKeys.push(col);
        checkIcon?.classList.remove('hidden');
    }
    renderPkChips();
    updateReplReviewSummary();
}

export function renderPkChips() {
    const container = document.getElementById('replPkChipsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (replState.primaryKeys.length === 0) {
        container.innerHTML = '<span class="text-slate-400 text-xs italic">No primary keys selected</span>';
        return;
    }

    replState.primaryKeys.forEach(col => {
        const chip = document.createElement('span');
        chip.className = "bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5";
        chip.innerHTML = `<span>${col}</span><button onclick="toggleReplPk('${col}')" class="hover:text-indigo-900"><i class="fa-solid fa-xmark text-[10px]"></i></button>`;
        container.appendChild(chip);
    });
}

export function setReplPayload(fmt) {
    replState.payloadFormat = fmt;
    const pBtn = document.getElementById('btnReplFmtParquet');
    const cBtn = document.getElementById('btnReplFmtCSV');
    const desc = document.getElementById('replPayloadDesc');

    if (fmt === 'Parquet') {
        pBtn.className = "p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all";
        cBtn.className = "p-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex flex-col items-center justify-center space-y-2 hover:border-indigo-300 transition-all";
        if (desc) desc.innerText = "Columnar format optimized for high-performance analytics and large-scale data processing in Microsoft Fabric.";
    } else {
        cBtn.className = "p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all";
        pBtn.className = "p-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex flex-col items-center justify-center space-y-2 hover:border-indigo-300 transition-all";
        if (desc) desc.innerText = "Delimited text format suitable for interoperability with external legacy data systems.";
    }
    updateReplReviewSummary();
}

export function toggleReplRowMarker() {
    const isChecked = document.getElementById('replRowMarkerToggle')?.checked;
    replState.rowMarkerEnabled = isChecked;
    const panel = document.getElementById('replRowMarkerPanel');
    const notice = document.getElementById('replRowMarkerOffNotice');

    if (isChecked) {
        panel?.classList.remove('hidden');
        notice?.classList.add('hidden');
    } else {
        panel?.classList.add('hidden');
        notice?.classList.remove('hidden');
    }
    updateReplReviewSummary();
}

export function setReplSourceField(val) {
    replState.sourceField = val;
    updateReplReviewSummary();
}

export function toggleReplChangeType(type) {
    if (type === 'None') {
        replState.changeTypes = ['None'];
    } else {
        const noneIdx = replState.changeTypes.indexOf('None');
        if (noneIdx > -1) replState.changeTypes.splice(noneIdx, 1);

        const idx = replState.changeTypes.indexOf(type);
        if (idx > -1) {
            replState.changeTypes.splice(idx, 1);
        } else {
            replState.changeTypes.push(type);
        }
        if (replState.changeTypes.length === 0) replState.changeTypes = ['None'];
    }

    ['Insert', 'Update', 'Delete', 'None'].forEach(ct => {
        const chip = document.getElementById(`chipCt${ct}`);
        if (chip) {
            if (replState.changeTypes.includes(ct)) {
                chip.className = "px-3.5 py-2 rounded-xl text-xs font-bold border border-indigo-600 bg-indigo-50 text-indigo-700 transition-all";
                chip.innerText = `${ct} ✓`;
            } else {
                chip.className = "px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:border-indigo-300 transition-all";
                chip.innerText = ct;
            }
        }
    });
    updateReplReviewSummary();
}

export function updateReplReviewSummary() {
    if (document.getElementById('rrevDb')) document.getElementById('rrevDb').innerText = replState.database;
    if (document.getElementById('rrevTable')) document.getElementById('rrevTable').innerText = `${replState.schema}.${replState.table}`;
    if (document.getElementById('rrevMeta')) document.getElementById('rrevMeta').innerText = replState.autoMetadata ? 'Enabled' : 'Disabled';
    if (document.getElementById('rrevPk')) document.getElementById('rrevPk').innerText = replState.primaryKeys.join(', ') || 'None';
    if (document.getElementById('rrevFormat')) document.getElementById('rrevFormat').innerText = replState.payloadFormat;
    if (document.getElementById('rrevRowMarker')) document.getElementById('rrevRowMarker').innerText = replState.rowMarkerEnabled ? 'Enabled' : 'Disabled';
    if (document.getElementById('rrevSourceField')) {
        document.getElementById('rrevSourceField').innerText = replState.rowMarkerEnabled ? `${replState.sourceField} (${replState.changeTypes.join(', ')})` : 'N/A';
    }
}

export function updateReplUI() {
    renderPkChips();
    updateReplReviewSummary();
}

export async function openReplConfirmModal() {
    try {
        await replicationApi.start({ ...replState });
        showToast(`Open Mirroring initialized for ${replState.schema}.${replState.table}`, 'success');
    } catch (err) { showApiError(err, 'Could not start replication'); }
}

export function filterReplHistory(type) {
    ['All', 'Running', 'Completed'].forEach(t => {
        const btn = document.getElementById(`btnReplHistFilter${t}`);
        if (btn) {
            if (t === type) {
                btn.className = "px-2.5 py-1 rounded font-semibold text-indigo-600 bg-indigo-50";
            } else {
                btn.className = "px-2.5 py-1 rounded text-slate-600 hover:bg-slate-50";
            }
        }
    });

    const rows = document.querySelectorAll('.repl-hist-row');
    rows.forEach(r => {
        const status = r.getAttribute('data-status');
        if (type === 'All' || status === type) {
            r.classList.remove('hidden');
        } else {
            r.classList.add('hidden');
        }
    });
}
