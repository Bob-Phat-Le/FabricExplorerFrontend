import { call, ApiError } from './client.js';
import { mocks } from '../mocks/handlers.js';

const BasePath = '/connections';

// Backend có thể trả mảng/đối tượng trần hoặc bọc trong { data } / { data: { items } } / { items }.
// Chuẩn hoá tại đây để feature code luôn nhận Connection / Connection[] / null.
const unwrap = r => (r && typeof r === 'object' && !Array.isArray(r) && 'data' in r ? r.data : r);
const toList = r => {
    const d = unwrap(r);
    return Array.isArray(d) ? d : (d?.items ?? []);
};

/**
 * Connection = { id, name, workspaceId, workspaceName?, tenantId, clientId, isActive?, environment? }
 * (backend KHÔNG nên trả clientSecret)
 */

/** GET /connections -> Connection[] */
export const list = () => call({ method: 'GET', path: BasePath }, mocks.connections.list).then(toList);

/** GET /connections/:id -> Connection */
export const get = id => call({ method: 'GET', path: `${BasePath}/${id}` }, mocks.connections.get).then(unwrap);

/** GET /connections/active -> Connection | null  (404/204 nghĩa là chưa có connection active -> null) */
export const getActive = () =>
    call({ method: 'GET', path: `${BasePath}/active` }, mocks.connections.getActive)
        .then(r => unwrap(r) ?? null)
        .catch(err => {
            if (err instanceof ApiError && err.status === 404) return null;
            throw err;
        });

/** POST /connections  body: { name, workspaceId, tenantId, tokenEndpoint, clientId, clientSecret } -> Connection */
export const save = payload => call({ method: 'POST', path: BasePath, body: payload }, mocks.connections.save).then(unwrap);

/** PATCH /connections/:id  body như save; bỏ clientSecret nếu không đổi -> Connection */
export const update = (id, payload) => call({ method: 'PATCH', path: `${BasePath}/${id}`, body: payload }, mocks.connections.update).then(unwrap);

/** POST /connections/test  body: như save -> { ok: true } (kiểm tra token + quyền workspace) */
export const test = payload => call({ method: 'POST', path: `${BasePath}/test`, body: payload }, mocks.ok);

/** POST /connections/:id/test -> { ok: true } */
export const testSaved = id => call({ method: 'POST', path: `${BasePath}/${id}/test` }, mocks.ok);

/** POST /connections/:id/active -> 2xx  (đặt connection làm active) */
export const activate = id => call({ method: 'POST', path: `${BasePath}/${id}/active` }, mocks.connections.activate);
