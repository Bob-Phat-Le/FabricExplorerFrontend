// Nạp HTML của từng view / modal / drawer vào DOM. Cần phục vụ qua HTTP (không mở bằng file://).
const VIEWS = ['connection', 'discovery', 'ingestion', 'replication', 'jobinstances', 'settings'];
const OVERLAYS = ['modal-oauth', 'modal-create-item', 'drawer-job-details'];

async function fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
    return res.text();
}

export async function loadViews() {
    const [views, overlays] = await Promise.all([
        Promise.all(VIEWS.map(v => fetchText(`views/${v}.html`))),
        Promise.all(OVERLAYS.map(o => fetchText(`partials/${o}.html`))),
    ]);
    document.getElementById('mainContainer').insertAdjacentHTML('beforeend', views.join('\n'));
    document.getElementById('overlaysMount').insertAdjacentHTML('beforeend', overlays.join('\n'));
}
