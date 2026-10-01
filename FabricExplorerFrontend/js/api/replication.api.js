import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

/** POST /replications  body: replState { database, schema, table, autoMetadata, primaryKeys[], payloadFormat, rowMarkerEnabled, sourceField, changeTypes[] } -> { id, status } */
export const start = config => call({ method: 'POST', path: '/replications', body: config }, mocks.replication.start);

/** GET /replications -> ReplicationRun[]  (lịch sử; bảng history trong view hiện còn là HTML tĩnh) */
export const list = () => call({ method: 'GET', path: '/replications' }, mocks.list);
