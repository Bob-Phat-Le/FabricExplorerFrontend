import { call } from './client';
import { mocks } from '../mocks/handlers';
import type { CreateItemPayload, FabricItem, JobsPage, JobInstance } from '@/types/fabric';

export const list = () => call<FabricItem[]>({ method: 'GET', path: '/items' }, mocks.items.list);

export const create = (payload: CreateItemPayload) =>
  call<FabricItem>({ method: 'POST', path: '/items', body: payload }, mocks.items.create);

export const listJobs = (itemId: string, { continuationToken }: { continuationToken?: string | null } = {}) =>
  call<JobsPage>({ method: 'GET', path: `/items/${itemId}/jobs`, query: { continuationToken } }, mocks.items.jobs);

export const getJob = (itemId: string, jobId: string) =>
  call<JobInstance | undefined>({ method: 'GET', path: `/items/${itemId}/jobs/${jobId}` }, mocks.items.job);
