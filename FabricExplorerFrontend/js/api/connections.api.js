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
