import { call } from './client.js';
import { mocks } from '../mocks/handlers.js';

/**
 * POST /ingestions  (multipart/form-data)
 *   - config: JSON string của formState (uploadMode, payloadFormat, csvHeader, csvDelimiter, ingestToTable, targetTable, tableLoadMode, postLoadAction, archivePath)
 *   - file:   nội dung file (nếu có)
 * -> { jobId, status }
 * @param {object} config  @param {File|null} file  @param {{simulateOutcome?:string}} meta chỉ dùng cho mock
 */
export function submit(config, file, meta = {}) {
    const body = new FormData();
    body.append('config', JSON.stringify(config));
    if (file) body.append('file', file);
    return call({ method: 'POST', path: '/ingestions', body, meta }, mocks.ingestion.submit);
}

/** GET /ingestions -> IngestionRun[]  (lịch sử; bảng history trong view hiện còn là HTML tĩnh) */
export const list = () => call({ method: 'GET', path: '/ingestions' }, mocks.list);
