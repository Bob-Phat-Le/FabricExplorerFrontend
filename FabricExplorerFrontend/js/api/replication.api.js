import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

export const start = config => call({ method: 'POST', path: '/replications', body: config }, mocks.replication.start);

export const list = () => call({ method: 'GET', path: '/replications' }, mocks.list);
