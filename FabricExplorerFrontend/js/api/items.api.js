import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

/** GET /items -> FabricItem[]  { id, name, type, workspace } */
export const list = () => call({ method: 'GET', path: '/items' }, mocks.items.list);

/** POST /items  body: { displayName, type } -> FabricItem */
export const create = payload => call({ method: 'POST', path: '/items', body: payload }, mocks.items.create);

/** GET /items/:id/jobs?continuationToken= -> { items: JobInstance[], continuationToken: string|null } */
export const listJobs = (itemId, { continuationToken } = {}) =>
    call({ method: 'GET', path: `/items/${itemId}/jobs`, query: { continuationToken } }, mocks.items.jobs);

/** GET /items/:id/jobs/:jobId -> JobInstance  (drawer chi tiết hiện đọc từ danh sách đã nạp) */
export const getJob = (itemId, jobId) => call({ method: 'GET', path: `/items/${itemId}/jobs/${jobId}` }, mocks.items.job);
