export const VIEW_IDS = ['connection', 'discovery', 'ingestion', 'replication', 'jobinstances', 'settings'];

const enterHooks = {};

export function onViewEnter(tabId, fn) {
    (enterHooks[tabId] ||= []).push(fn);
}

export function switchTab(tabId) {
    VIEW_IDS.forEach(id => {
        document.getElementById(`view-${id}`)?.classList.add('hidden');
        document.getElementById(`nav-${id}`)?.classList.remove('active-nav-item');
    });

    document.getElementById(`view-${tabId}`)?.classList.remove('hidden');
    document.getElementById(`nav-${tabId}`)?.classList.add('active-nav-item');

    (enterHooks[tabId] || []).forEach(fn => fn());
}
