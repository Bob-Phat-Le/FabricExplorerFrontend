// UI helpers dùng chung: toast, modal, drawer, sidebar, clipboard.

export function toggleSidebarCollapse() {
    const sidebar = document.getElementById('sidebar');
    const texts = document.querySelectorAll('.sidebar-text');
    const icon = document.getElementById('collapseIcon');

    if (sidebar.classList.contains('w-60')) {
        sidebar.classList.remove('w-60');
        sidebar.classList.add('w-16');
        texts.forEach(el => el.classList.add('hidden'));
        if (icon) icon.className = "fa-solid fa-angles-right";
    } else {
        sidebar.classList.remove('w-16');
        sidebar.classList.add('w-60');
        texts.forEach(el => el.classList.remove('hidden'));
        if (icon) icon.className = "fa-solid fa-angles-left";
    }
}

export function toggleUserMenu() {
    document.getElementById('userMenu')?.classList.toggle('hidden');
}

export function closeModal(id) {
    document.getElementById(id)?.classList.add('hidden');
}

export function closeDrawer(id) {
    document.getElementById(id)?.classList.add('hidden');
}

/** Escape chuỗi trước khi chèn vào innerHTML (tên connection, message lỗi từ server...). */
export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');

    let bgBorder = 'bg-white border-slate-200 text-slate-800';
    let icon = 'fa-solid fa-circle-info text-indigo-500';

    if (type === 'success') {
        bgBorder = 'bg-white border-emerald-200 text-slate-800';
        icon = 'fa-solid fa-circle-check text-emerald-500';
    } else if (type === 'warning') {
        bgBorder = 'bg-white border-amber-200 text-slate-800';
        icon = 'fa-solid fa-triangle-exclamation text-amber-500';
    } else if (type === 'error') {
        bgBorder = 'bg-white border-rose-200 text-slate-800';
        icon = 'fa-solid fa-circle-xmark text-rose-500';
    }

    toast.className = `pointer-events-auto p-3.5 rounded-xl border shadow-lg flex items-start space-x-3 text-xs transition-all duration-300 transform translate-y-2 opacity-0 ${bgBorder}`;
    toast.innerHTML = `
        <i class="${icon} text-base mt-0.5"></i>
        <div class="flex-1 pr-2">${message}</div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark"></i></button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

export function copyToClipboard(text, successMsg = 'Copied to clipboard') {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);
    showToast(successMsg, 'success');
}

/** Hiển thị lỗi từ tầng API (ApiError.message đã được chuẩn hoá trong api/client.js). */
export function showApiError(err, fallback = 'Request failed') {
    console.error(err);
    showToast(escapeHtml(err?.message || fallback), 'error');
}
