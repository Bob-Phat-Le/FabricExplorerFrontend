// Trang Ingestion: wizard 5 bước upload file → bảng đích → post-load.
import { formState } from '../state/store.js';
import { showApiError, showToast } from '../core/ui.js';
import * as ingestionApi from '../api/ingestion.api.js';

let currentStep = 1;

export function goToStep(stepNum) {
    currentStep = stepNum;
    for (let i = 1; i <= 5; i++) {
        const card = document.getElementById(`wizard-step-${i}`);
        if (card) card.classList.add('hidden');

        const badge = document.getElementById(`step-badge-${i}`);
        const title = document.getElementById(`step-title-${i}`);

        if (badge && title) {
            if (i < currentStep) {
                badge.className = "w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-sm";
                badge.innerHTML = '<i class="fa-solid fa-check"></i>';
                title.className = "font-semibold text-slate-700";
            } else if (i === currentStep) {
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
    document.getElementById(`wizard-step-${stepNum}`)?.classList.remove('hidden');
    updateReviewSummary();
}

export function prevStep() { if (currentStep > 1) goToStep(currentStep - 1); }

export function nextStep() { if (currentStep < 5) goToStep(currentStep + 1); }

export function resetWizard() {
    formState.hasFile = false;
    removeSelectedFile();
    goToStep(1);
    showToast('Ingestion wizard reset', 'info');
}

export function simulateSelectFile(name, type, size) {
    formState.hasFile = true;
    formState.fileName = name;
    formState.fileType = type;
    formState.fileSize = size;

    document.getElementById('dropZone')?.classList.add('hidden');
    document.getElementById('selectedFileCard')?.classList.remove('hidden');

    if (document.getElementById('selectedFileNameLabel')) document.getElementById('selectedFileNameLabel').innerText = name;
    if (document.getElementById('selectedFileTypeBadge')) document.getElementById('selectedFileTypeBadge').innerText = type;
    if (document.getElementById('selectedFileSizeLabel')) document.getElementById('selectedFileSizeLabel').innerText = size;
    if (document.getElementById('targetFileNameInput')) document.getElementById('targetFileNameInput').value = name;

    document.getElementById('btnStep1Next').disabled = false;
    updateReviewSummary();
}

export function removeSelectedFile() {
    formState.hasFile = false;
    document.getElementById('dropZone')?.classList.remove('hidden');
    document.getElementById('selectedFileCard')?.classList.add('hidden');
    document.getElementById('btnStep1Next').disabled = true;
    updateReviewSummary();
}

export function selectUploadMode(mode) {
    formState.uploadMode = mode;
    ['overwrite', 'append', 'createnew'].forEach(m => {
        const card = document.getElementById(`card-upload-${m}`);
        if (card) {
            if (m === mode.toLowerCase().replace(' ', '')) {
                card.className = "cursor-pointer border-2 border-indigo-600 bg-indigo-50/30 rounded-xl p-3.5 flex flex-col justify-between transition-all";
            } else {
                card.className = "cursor-pointer border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-300 transition-all";
            }
        }
    });
    const warn = document.getElementById('uploadOverwriteWarning');
    if (warn) {
        if (mode === 'Overwrite') warn.classList.remove('hidden');
        else warn.classList.add('hidden');
    }
    updateReviewSummary();
}

export function selectPayloadFormat(fmt) {
    formState.payloadFormat = fmt;
    const csvBtn = document.getElementById('btnFormatCSV');
    const parBtn = document.getElementById('btnFormatParquet');
    const csvSettings = document.getElementById('cardCsvSettings');
    const desc = document.getElementById('formatDescriptionText');

    if (fmt === 'CSV') {
        csvBtn.className = "py-2.5 px-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold text-xs flex items-center justify-center space-x-2";
        parBtn.className = "py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 hover:border-indigo-300";
        csvSettings?.classList.remove('hidden');
        if (desc) desc.innerText = "Comma-separated text file format with customizable delimiters.";
    } else {
        parBtn.className = "py-2.5 px-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold text-xs flex items-center justify-center space-x-2";
        csvBtn.className = "py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs flex items-center justify-center space-x-2 hover:border-indigo-300";
        csvSettings?.classList.add('hidden');
        if (desc) desc.innerText = "Columnar storage format optimized for high-performance analytical queries.";
    }
    updateReviewSummary();
}

export function setDelimiter(char) {
    formState.csvDelimiter = char;
    const input = document.getElementById('csvDelimiterInput');
    if (input) input.value = char;
    updateReviewSummary();
}

export function toggleTableIngestion() {
    const isChecked = document.getElementById('ingestTableToggle')?.checked;
    formState.ingestToTable = isChecked;
    const panel = document.getElementById('tableConfigPanel');
    const notice = document.getElementById('tableOffNotice');

    if (isChecked) {
        panel?.classList.remove('hidden');
        notice?.classList.add('hidden');
    } else {
        panel?.classList.add('hidden');
        notice?.classList.remove('hidden');
    }
    updateReviewSummary();
}

export function setTargetTableName(name) {
    formState.targetTable = name;
    const input = document.getElementById('targetTableNameInput');
    if (input) input.value = name;
    updateReviewSummary();
}

export function selectTableLoadMode(mode) {
    formState.tableLoadMode = mode;
    ['append', 'overwrite'].forEach(m => {
        const card = document.getElementById(`card-table-${m}`);
        if (card) {
            if (m === mode.toLowerCase()) {
                card.className = "cursor-pointer border-2 border-indigo-600 bg-indigo-50/30 rounded-xl p-3.5 flex flex-col justify-between";
            } else {
                card.className = "cursor-pointer border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-300";
            }
        }
    });
    const warn = document.getElementById('tableOverwriteWarning');
    if (warn) {
        if (mode === 'Overwrite') warn.classList.remove('hidden');
        else warn.classList.add('hidden');
    }
    updateReviewSummary();
}

export function selectPostLoadAction(act) {
    formState.postLoadAction = act;
    ['archive', 'retain', 'delete'].forEach(a => {
        const card = document.getElementById(`card-post-${a}`);
        if (card) {
            if (a === act.toLowerCase()) {
                card.className = "cursor-pointer border-2 border-indigo-600 bg-indigo-50/30 rounded-xl p-3.5 flex flex-col justify-between";
            } else {
                card.className = "cursor-pointer border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-300";
            }
        }
    });

    const archivePanel = document.getElementById('archiveFolderContainer');
    const deleteWarn = document.getElementById('deleteWarningNotice');

    if (act === 'Archive') {
        archivePanel?.classList.remove('hidden');
        deleteWarn?.classList.add('hidden');
    } else if (act === 'Delete') {
        archivePanel?.classList.add('hidden');
        deleteWarn?.classList.remove('hidden');
    } else {
        archivePanel?.classList.add('hidden');
        deleteWarn?.classList.add('hidden');
    }
    updateReviewSummary();
}

export function updateReviewSummary() {
    if (document.getElementById('revFileName')) document.getElementById('revFileName').innerText = formState.fileName || 'None Selected';
    if (document.getElementById('revUploadMode')) document.getElementById('revUploadMode').innerText = formState.uploadMode;
    if (document.getElementById('revFormat')) document.getElementById('revFormat').innerText = formState.payloadFormat;
    if (document.getElementById('revCsvDetails')) {
        document.getElementById('revCsvDetails').innerText = formState.payloadFormat === 'CSV' ? `${formState.csvHeader ? 'Header Included' : 'No Header'} / '${formState.csvDelimiter}'` : 'N/A';
    }
    if (document.getElementById('revTableIngest')) document.getElementById('revTableIngest').innerText = formState.ingestToTable ? 'Enabled' : 'Disabled';
    if (document.getElementById('revTableDetails')) {
        document.getElementById('revTableDetails').innerText = formState.ingestToTable ? `${formState.targetTable} (${formState.tableLoadMode})` : 'Staging Only';
    }
    if (document.getElementById('revPostLoad')) {
        document.getElementById('revPostLoad').innerText = formState.postLoadAction === 'Archive' ? `Archive (${formState.archivePath})` : formState.postLoadAction;
    }
}

export async function triggerIngestionExecution() {
    // simOutcomeSelect chỉ để demo; khi useMock = false giá trị này KHÔNG được gửi đi.
    const simulateOutcome = document.getElementById('simOutcomeSelect')?.value || 'success';
    try {
        // TODO(api): dropzone hiện chỉ giả lập file (simulateSelectFile). Khi có File thật, truyền vào tham số thứ 2.
        const job = await ingestionApi.submit({ ...formState }, null, { simulateOutcome });
        showToast(`Ingestion job for ${formState.fileName} completed successfully`, 'success');
        return job;
    } catch (err) {
        showApiError(err, 'Ingestion failed during table load step');
    }
}

export function filterHistory(type) {
    ['All', 'Completed', 'Failed'].forEach(t => {
        const btn = document.getElementById(`btnHistFilter${t}`);
        if (btn) {
            if (t === type) {
                btn.className = "px-2.5 py-1 rounded font-semibold text-indigo-600 bg-indigo-50";
            } else {
                btn.className = "px-2.5 py-1 rounded text-slate-600 hover:bg-slate-50";
            }
        }
    });

    const rows = document.querySelectorAll('.job-row');
    rows.forEach(r => {
        const status = r.getAttribute('data-status');
        if (type === 'All' || status === type) {
            r.classList.remove('hidden');
        } else {
            r.classList.add('hidden');
        }
    });
}
