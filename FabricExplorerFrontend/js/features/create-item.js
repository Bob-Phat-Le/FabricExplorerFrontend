// Modal tạo Fabric item (3 bước).
import * as store from '../state/store.js';
import { showApiError } from '../core/ui.js';
import { selectMonitoredItem } from './job-instances.js';
import * as itemsApi from '../api/items.api.js';

export function openCreateItemModal() {
    document.getElementById('modalCreateItem')?.classList.remove('hidden');
    goToCreateItemStep(1);
}

export function closeCreateItemModal() {
    document.getElementById('modalCreateItem')?.classList.add('hidden');
}

export function selectCreateItemType(type) {
    store.createItemState.selectedType = type;
    ['Lakehouse', 'Warehouse', 'Mirrored'].forEach(t => {
        const card = document.getElementById(`cardType${t}`);
        if (card) {
            if (t === (type === 'MirroredDatabase' ? 'Mirrored' : type)) {
                card.className = "cursor-pointer p-4 rounded-xl border-2 border-indigo-600 bg-indigo-50/40 transition-all text-left space-y-2";
            } else {
                card.className = "cursor-pointer p-4 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white transition-all text-left space-y-2";
            }
        }
    });
}

export function goToCreateItemStep(stepNum) {
    store.createItemState.step = stepNum;
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`cstep-content-${i}`)?.classList.add('hidden');
    }
    document.getElementById(`cstep-content-${stepNum}`)?.classList.remove('hidden');
}

export async function executeCreateItem() {
    goToCreateItemStep(3);
    document.getElementById('createProgressState')?.classList.remove('hidden');
    document.getElementById('createSuccessState')?.classList.add('hidden');

    const name = document.getElementById('newItemNameInput')?.value || 'New Analytics Item';
    try {
        const created = await itemsApi.create({ displayName: name, type: store.createItemState.selectedType });

        document.getElementById('createProgressState')?.classList.add('hidden');
        document.getElementById('createSuccessState')?.classList.remove('hidden');
        if (document.getElementById('createdResName')) document.getElementById('createdResName').innerText = created.name;
        if (document.getElementById('createdResType')) document.getElementById('createdResType').innerText = created.type;
        if (document.getElementById('createdResId')) document.getElementById('createdResId').innerText = created.id;

        store.createItemState.lastCreated = created;
    } catch (err) {
        showApiError(err, 'Could not create item');
        goToCreateItemStep(2);
    }
}

export function useCreatedItemAsMonitored() {
    if (store.createItemState.lastCreated) {
        store.replaceContents(store.fabricItems, [store.createItemState.lastCreated, ...store.fabricItems]);
        selectMonitoredItem(store.createItemState.lastCreated.id);
    }
    closeCreateItemModal();
}
