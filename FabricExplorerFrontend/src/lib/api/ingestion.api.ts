import { call } from './client';
import { mocks } from '../mocks/handlers';
import type { IngestionForm, IngestionResult } from '@/types/ingestion';

export function submit(config: IngestionForm, file: File | null, meta: Record<string, unknown> = {}) {
  const body = new FormData();
  body.append('config', JSON.stringify(config));
  if (file) body.append('file', file);
  return call<IngestionResult>({ method: 'POST', path: '/ingestions', body, meta }, mocks.ingestion.submit);
}

export const list = () => call<unknown[]>({ method: 'GET', path: '/ingestions' }, mocks.list);
