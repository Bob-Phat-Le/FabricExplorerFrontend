// Entry point: nạp view, nối handler inline (onclick="...") vào window, đăng ký hook điều hướng, khởi tạo dữ liệu.
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

// HTML vẫn dùng onclick="fn()" nên các hàm phải nằm trên window.
// Muốn bỏ dần: thay onclick bằng addEventListener trong từng feature, rồi xoá dòng tương ứng ở đây.
Object.assign(window, router, ui, connection, discovery, ingestion, replication, jobInstances, createItem);
window.formState = formState;   // được HTML tham chiếu trực tiếp (oninput="formState.fileName = ...")
window.replState = replState;

router.onViewEnter('connection', connection.loadConnections);   // luôn lấy dữ liệu mới khi vào tab
router.onViewEnter('discovery', discovery.loadDiscoveryResources);   // nạp dropdown theo connection đang active
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
