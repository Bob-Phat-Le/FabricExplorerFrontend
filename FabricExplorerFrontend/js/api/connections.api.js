import { call, ApiError } from './client.js';
import { mocks } from '../mocks/handlers.js';

const BasePath = '/connections';

const unwrap = r => (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r ? r.data : r);
const toList = r => {
    const d = unwrap(r);
    return Array.isArray(d) ? d : (d?.items ?? []);
};

export const list = () => call({ method: 'GET', path: BasePath }, mocks.connections.list).then(toList);

export const get = id => call({ method: 'GET', path: `${BasePath}/${id}` }, mocks.connections.get).then(unwrap);

export const getActive = () =>
    call({ method: 'GET', path: `${BasePath}/active` }, mocks.connections.getActive)
        .then(r => unwrap(r) ?? null)
        .catch(err => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
        });

export const save = payload => call({ method: 'POST', path: BasePath, body: payload }, mocks.connections.save).then(unwrap);

export const update = (id, payload) => call({ method: 'PATCH', path: `${BasePath}/${id}`, body: payload }, mocks.connections.update).then(unwrap);

export const test = payload => call({ method: 'POST', path: `${BasePath}/test`, body: payload }, mocks.ok);

export const testSaved = id => call({ method: 'POST', path: `${BasePath}/${id}/test` }, mocks.ok);

export const activate = id => call({ method: 'POST', path: `${BasePath}/${id}/active` }, mocks.connections.activate);

// Backend phân trang theo offset bắt đầu từ 0 (page=0 là trang đầu).
// UI luôn dùng số trang bắt đầu từ 1; chỉ đổi ở đây khi gửi request.
const SERVER_PAGE_BASE = 0;

const firstNumber = (...vals) => vals.find(v => typeof v === 'number' && Number.isFinite(v)) ?? null;

/**
 * GET /connections?page=&pageSize=   (page bắt đầu từ 1, skip/take do backend xử lý)
 * Response: ApiResponse<PagedResponse<ConnectionResponse[]>>
 *   { data: { items: [...], pageInformation: { page, pageSize, totalPages, totalItems, itemsCount, ... } } }
 * Trả về: { items, page, pageSize, totalItems, totalPages }
 */
export const listPage = ({ page, pageSize }) =>
    call({ method: 'GET', path: BasePath, query: { page, pageSize } }, mocks.connections.list)
        .then(r => {
            const d = unwrap(r);

            // Mock / server chưa phân trang (mảng trần) -> cắt phía client
            if (Array.isArray(d)) {
                const start = (page - 1) * pageSize;
                return {
                    items: d.slice(start, start + pageSize),
                    page, pageSize,
                    totalItems: d.length,
                    totalPages: Math.max(1, Math.ceil(d.length / pageSize))
                };
            }

            const items = d?.items ?? [];
            const pi = d?.pageInformation ?? {};
            const size = pi.pageSize ?? pageSize;
            const totalItems = pi.totalItems ?? items.length;
            return {
                items,
                page: pi.page ?? page,
                pageSize: size,
                totalItems,
                totalPages: pi.totalPages ?? Math.max(1, Math.ceil(totalItems / size))
            };
        });
