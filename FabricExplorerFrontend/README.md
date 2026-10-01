# Fabric Explorer — cấu trúc sau khi tách

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
      api/                  ★ tầng gọi backend: config.js · client.js · <domain>.api.js
      mocks/                handlers.js + seeds.js (dữ liệu mẫu cũ) — xoá khi backend xong

## Chuyển sang backend thật
1. `js/api/config.js`: đặt `useMock: false`, chỉnh `baseUrl`, điền `getAuthHeaders()`.
2. Lỗi: `{ message, code, details }` hoặc ProblemDetails của ASP.NET (`title` / `detail` / `errors`) → tự hiện lên toast.
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
| discovery.* | GET /discovery/lakehouse/tables · /warehouse · /warehouse/connection-string · /mirrored-db · /mirrored-db/status · /mirrored-db/tables/status; POST /mirrored-db/start · /stop | query `workspaceId` |
| ingestion.submit | POST /ingestions | multipart: `config` (JSON) + `file` |
| replication.start | POST /replications | body = `replState` |
| items.list / create | GET, POST /items | |
| items.listJobs | GET /items/:id/jobs?continuationToken= | → `{ items, continuationToken }` |

## Còn dang dở (đánh dấu `TODO(api)` trong code)
- Các thẻ Discovery đã gọi API nhưng **chưa render dữ liệu trả về** — HTML vẫn là bản tĩnh như gốc.
- Bảng lịch sử Ingestion/Replication vẫn là hàng HTML cứng (`ingestion.list`, `replication.list` có sẵn nhưng chưa nối).
- Dropzone vẫn giả lập file (`simulateSelectFile`); chưa có `<input type="file">` thật nên `ingestion.submit` nhận `file = null`.
- Lọc/tìm kiếm Job Instances và auto-refresh vốn là hàm rỗng trong file gốc, giữ nguyên.
