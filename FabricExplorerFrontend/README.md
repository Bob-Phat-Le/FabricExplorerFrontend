
File gốc (3.219 dòng) được tách thành module. **Hành vi UI giữ nguyên**; khác biệt duy nhất là mọi thao tác "gọi backend" giờ đi qua `js/api/`.

## Chạy
Phải phục vụ qua HTTP (view được nạp bằng `fetch`, không mở bằng `file://`):

    python3 -m http.server 8000     # rồi mở http://localhost:8000

## Cấu trúc
    index.html              shell: header, sidebar, footer
    css/app.css
    views/*.html            6 trang (connection, discovery, ingestion, replication, jobinstances, settings)
    partials/*.html         modal OAuth, modal tạo item, drawer chi tiết job
    js/
      main.js               entry: nạp view, gắn handler lên window, đăng ký hook, init
      core/                 router.js · view-loader.js · ui.js (toast/modal/clipboard)
      state/store.js        state dùng chung (connections, items, jobs, formState, replState…)
      features/             1 file / trang: connection, discovery, ingestion, replication, job-instances, create-item
      api/                  ★ tầng gọi backend: config.js · client.js · stream.js (SSE) · <domain>.api.js
      mocks/                handlers.js + seeds.js (dữ liệu mẫu cũ) — xoá khi backend xong

## Chuyển sang backend thật
1. `js/api/config.js`: đặt `useMock: false`, chỉnh `baseUrl`, điền `getAuthHeaders()`.
2. Lỗi: đọc từ `ApiResponse<T>.error = { code, message, traceId, details }` → `ApiError { status, code, message, traceId, details }`, `message` tự hiện lên toast.
   Trường `ApiResponse.errors` (string[]) **không còn được dùng**. Dự phòng cho response lỗi do ASP.NET tự sinh (ProblemDetails: `title` / `detail` / `errors` theo field).
   Backend cần bật CORS cho origin của frontend (cho cả `PATCH`).
3. Sửa contract tại đúng 1 chỗ: file `*.api.js` tương ứng.

## Endpoint đang được giả định
| Hàm | Method & path | Ghi chú |
|---|---|---|
| connections.list | GET /connections | `Connection[]` (chấp nhận mảng trần, `{data}` hoặc `{items}`); không trả `clientSecret` |
| connections.get | GET /connections/:id | |
| connections.getActive | GET /connections/active | 404/204 → coi như chưa có connection active |
| connections.save | POST /connections | name, workspaceId, tenantId, tokenEndpoint, clientId, clientSecret |
| connections.update | PATCH /connections/:id | như save; bỏ `clientSecret` khi không đổi |
| connections.test | POST /connections/test | test trước khi lưu |
| connections.testSaved | POST /connections/:id/test | |
| connections.activate | POST /connections/:id/active | |
| auth.logout | POST /auth/logout | |
| discovery.listWorkspaces | GET /Workspaces | **backend cần cung cấp** (xem BackendPatch_Workspaces.zip). Header `X-Connection-Id` dùng cho mọi endpoint discovery; connection chỉ cấp tenant/client id/secret |
| discovery.listLakehouses | GET /workspaces/:ws/Lakehouses | gọi cho từng workspace rồi gộp vào một dropdown |
| discovery.listLakehouseTables | GET /workspaces/:ws/Lakehouses/:id/tables?pageSize=&continuationToken= | `data` là `EventStreamingAdapter<{ items, pageInformation.nextToken }>` (xem *Streaming*); "Load more" dùng nextToken |
| discovery.listWarehouses | GET /workspaces/:ws/Warehouses | |
| discovery.getWarehouse | GET /workspaces/:ws/Warehouses/:id | stream: `online-status` |
| discovery.getWarehouseConnectionString | GET /workspaces/:ws/Warehouses/:id/connection-string | `{ connectionString, database }` |
| discovery.listMirroredDatabases | GET /workspaces/:ws/MirroredDatabases | |
| discovery.getMirroredDb | GET .../MirroredDatabases/:id | `createdAt` có thể null (Fabric không cung cấp); stream: `mirroring-status`, `source-info` |
| discovery.getMirroringStatus | GET .../MirroredDatabases/:id/status | `status` trả ngay; stream: `mirroring-metrics` (`lastSynchronization`, `recordSynchronized`, `currentLatency` giây) |
| stream.openStream | GET /event-streams/:streamId | SSE, không cần `X-Connection-Id`; xem *Streaming* |
| discovery.startMirroring / stopMirroring | POST .../MirroredDatabases/:id/start · /stop | UI poll `/status` đến khi Running/Stopped |
| discovery.getTablesMirroringStatus | GET .../MirroredDatabases/:id/tables/status | `tableName`, `source`, `target`, `status`, `lastSync`, `lag` (giây) |
| ingestion.submit | POST /ingestions | multipart: `config` (JSON) + `file` |
| replication.start | POST /replications | body = `replState` |
| items.list / create | GET, POST /items | |
| items.listJobs | GET /items/:id/jobs?continuationToken= | → `{ items, continuationToken }` |

## Còn dang dở (đánh dấu `TODO(api)` trong code)
- Discovery đã gọi API thật và render dữ liệu thật (dropdown liệt kê item của MỌI workspace mà connection active nhìn thấy; mỗi item mang workspaceId riêng).
- Bảng lịch sử Ingestion/Replication vẫn là hàng HTML cứng (`ingestion.list`, `replication.list` có sẵn nhưng chưa nối).
- Dropzone vẫn giả lập file (`simulateSelectFile`); chưa có `<input type="file">` thật nên `ingestion.submit` nhận `file = null`.
- Lọc/tìm kiếm Job Instances và auto-refresh vốn là hàm rỗng trong file gốc, giữ nguyên.

## Streaming (SSE)
Các endpoint có thao tác chậm ở backend trả phần đã có **ngay**, phần còn lại đến qua SSE:

| Endpoint | Sự kiện | Trường được cập nhật |
|---|---|---|
| tables | `table-stats` (mỗi bảng 1 lần) | `rowCount`, `lastModifiedTime`, `status`, `statusMessage` của dòng có cùng `name` |
| warehouse | `online-status` | `onlineStatus`, `onlineStatusMessage` |
| mirrored db | `mirroring-status`, `source-info` | `mirroringStatus` + `status`; `sourceType` + `sourceName` |
| mirroring status | `mirroring-metrics` | `lastSynchronization`, `recordSynchronized`, `currentLatency` |

- `data` của các endpoint này là `{ isEventStreaming, streamId, pendingFields, innerData }`; `api/stream.js#asStreamed` chuẩn hoá thành `{ data, streamId, pendingFields, isStreaming }` (backend cũ trả DTO trần vẫn chạy, chỉ là không có stream).
- Trường chuỗi/enum chưa có mang `"Checking"` (UI hiện spinner); trường số/ngày chưa có nằm trong `pendingFields` (UI hiện skeleton).
- Tên trường của mỗi sự kiện trùng DTO nên chỉ cần `Object.assign(dto, payload)`.
- Dùng `fetch` + đọc stream (không dùng `EventSource`) để áp dụng được `getAuthHeaders()` và `AbortSignal`. Mất kết nối giữa chừng thì tự nối lại tối đa 3 lần, resume bằng `?lastEventId=`.
- `features/discovery.js#followStream` hủy stream khi người dùng chọn mục khác/bấm lại, và **luôn chốt các trường còn "Checking"** (về `Unknown`/`—`) khi stream lỗi hoặc kết thúc thiếu, để UI không kẹt ở trạng thái đang kiểm tra.
- Mock (`useMock: true`) mô phỏng cả stream bằng lịch sự kiện trong `mocks/handlers.js`.
