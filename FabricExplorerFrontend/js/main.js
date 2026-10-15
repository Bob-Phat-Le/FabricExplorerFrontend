import { loadViews } from './core/view-loader.js';
import * as router from './core/router.js';
import * as ui from './core/ui.js';
import * as connection from './features/connection.js';
import * as discovery from './features/discovery.js';
import * as ingestion from './features/ingestion.js';
import * as replication from './features/replication.js';
import * as jobInstances from './features/job-instances.js';
import * as createItem from './features/create-item.js';
import { formState, replState } from './state/store.js';

Object.assign(window, router, ui, connection, discovery, ingestion, replication, jobInstances, createItem);
window.formState = formState;
window.replState = replState;

router.onViewEnter('connection', connection.loadConnections);
router.onViewEnter('discovery', discovery.loadDiscoveryResources);
router.onViewEnter('replication', replication.updateReplUI);
router.onViewEnter('jobinstances', () => {
    jobInstances.renderJobInstancesUI();
    jobInstances.loadItems().catch(ui.showApiError);
});

async function init() {
    await loadViews();
    await connection.loadConnections();
}
init().catch(err => { console.error(err); document.body.insertAdjacentHTML('afterbegin', `<pre style="color:#b91c1c;padding:1rem">${err.message}</pre>`); });
