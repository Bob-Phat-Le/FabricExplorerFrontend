import { call } from './client';
import { mocks } from '../mocks/handlers';
import type { ReplicationConfig, ReplicationResult } from '@/types/replication';

export const start = (config: ReplicationConfig) =>
  call<ReplicationResult>({ method: 'POST', path: '/replications', body: config }, mocks.replication.start);

export const list = () => call<unknown[]>({ method: 'GET', path: '/replications' }, mocks.list);
