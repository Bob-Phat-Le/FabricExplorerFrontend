import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

export function submit(config, file, meta = {}) {
    const body = new FormData();
    body.append('config', JSON.stringify(config));
    if (file) body.append('file', file);
    return call({ method: 'POST', path: '/ingestions', body, meta }, mocks.ingestion.submit);
}

export const list = () => call({ method: 'GET', path: '/ingestions' }, mocks.list);
