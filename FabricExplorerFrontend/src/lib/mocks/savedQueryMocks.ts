import { ApiError, type RequestOptions } from '../api/client';
import type { CreateSavedQueryPayload } from '@/types/savedQuery/CreateSavedQueryPayload';
import type { SavedQuery } from '@/types/savedQuery/SavedQuery';
import type { UpdateSavedQueryPayload } from '@/types/savedQuery/UpdateSavedQueryPayload';
import type { MockSavedQuery } from './MockSavedQuery';
import { savedQueryRows } from './savedQueryStore';
import * as seeds from './seeds';

/** In-memory `/api/saved-queries` used when NEXT_PUBLIC_USE_MOCK=true. Same rules as the backend validator. */

const NAME_MAX = 200;
const DESCRIPTION_MAX = 1000;
const ITEM_TYPES = ['Lakehouse', 'Warehouse', 'MirroredDatabase'];
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const idFromPath = (req: RequestOptions) => req.path.split('/')[2];
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

const toResponse = (row: MockSavedQuery): SavedQuery => ({
  id: row.id,
  externalKey: row.key,
  name: row.name,
  description: row.description,
  connectionId: row.connectionId,
  connectionName: seeds.connections.find((c) => c.id === row.connectionId)?.name ?? null,
  target: { itemType: row.itemType, itemId: row.itemId, itemName: row.itemName },
  language: 'tsql',
  sql: row.sql,
  maxRows: row.maxRows,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const find = (req: RequestOptions) => {
  const row = savedQueryRows.find((r) => r.id === idFromPath(req));
  if (!row) throw new ApiError('Saved query not found', { status: 404, code: 'saved_query.not_found' });
  return row;
};

const badRequest = (field: string, message: string) =>
  new ApiError(`${field}: ${message}`, { status: 400, code: 'saved_query.bad_request' });

const duplicated = () =>
  new ApiError('A saved query with this name already exists for the connection', { status: 409, code: 'saved_query.duplicated' });

interface Content {
  name: string;
  description: string | null;
  sql: string;
  maxRows: number | null;
  itemType: string;
  itemId: string;
  itemName: string;
}

/** The same checks the backend rules apply (name, description, SQL, target, maxRows). */
function validate(c: Content) {
  if (!c.name.trim()) throw badRequest('name', 'Name is required.');
  if (c.name.trim().length > NAME_MAX) throw badRequest('name', `Name must be at most ${NAME_MAX} characters.`);
  if (c.description && c.description.length > DESCRIPTION_MAX)
    throw badRequest('description', `Description must be at most ${DESCRIPTION_MAX} characters.`);
  if (!c.sql.trim()) throw badRequest('sql', 'SQL must not be empty.');
  if (!ITEM_TYPES.some((t) => t.toLowerCase() === c.itemType.toLowerCase()))
    throw badRequest('target.itemType', `Item type must be one of: ${ITEM_TYPES.join(', ')}.`);
  if (!GUID.test(c.itemId)) throw badRequest('target.itemId', 'Item id must be a GUID.');
  if (c.maxRows !== null && c.maxRows <= 0) throw badRequest('maxRows', 'maxRows must be greater than zero, or null for unlimited.');
}

export const savedQueryMocks = {
  list: (req: RequestOptions) => {
    const q = req.query ?? {};
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20)));
    const term = String(q.search ?? '').trim().toLowerCase();

    const filtered = savedQueryRows
      .filter((r) => !q.connectionId || r.connectionId === q.connectionId)
      .filter((r) => !q.itemType || r.itemType.toLowerCase() === String(q.itemType).toLowerCase())
      .filter(
        (r) =>
          !term ||
          r.name.toLowerCase().includes(term) ||
          r.sql.toLowerCase().includes(term) ||
          r.itemName.toLowerCase().includes(term) ||
          (r.description ?? '').toLowerCase().includes(term),
      )
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));

    const items = filtered.slice((page - 1) * pageSize, page * pageSize).map(toResponse);
    return {
      items,
      pageInformation: {
        page,
        pageSize,
        totalItems: filtered.length,
        itemsCount: items.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  },

  get: (req: RequestOptions) => toResponse(find(req)),

  create: (req: RequestOptions) => {
    const body = req.body as CreateSavedQueryPayload;
    if (!seeds.connections.some((c) => c.id === body.connectionId))
      throw new ApiError('Connection not found', { status: 404, code: 'connection.not_found' });

    const content: Content = {
      name: body.name ?? '',
      description: body.description?.trim() || null,
      sql: body.sql ?? '',
      maxRows: body.maxRows ?? null,
      itemType: body.target?.itemType ?? '',
      itemId: body.target?.itemId ?? '',
      itemName: body.target?.itemName ?? '',
    };
    validate(content);
    if (savedQueryRows.some((r) => r.connectionId === body.connectionId && sameName(r.name, content.name))) throw duplicated();

    const row: MockSavedQuery = {
      id: `sq-${Date.now()}`,
      key: crypto.randomUUID(),
      connectionId: body.connectionId,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      ...content,
      name: content.name.trim(),
    };
    savedQueryRows.push(row);
    return toResponse(row);
  },

  update: (req: RequestOptions) => {
    const row = find(req);
    const body = req.body as UpdateSavedQueryPayload;

    const content: Content = {
      name: body.name ?? row.name,
      description: body.description === undefined ? row.description : body.description.trim() || null,
      sql: body.sql ?? row.sql,
      maxRows: body.unlimitedRows ? null : (body.maxRows ?? row.maxRows),
      itemType: body.target?.itemType ?? row.itemType,
      itemId: body.target?.itemId ?? row.itemId,
      itemName: body.target?.itemName ?? row.itemName,
    };
    validate(content);
    if (savedQueryRows.some((r) => r.id !== row.id && r.connectionId === row.connectionId && sameName(r.name, content.name)))
      throw duplicated();

    Object.assign(row, content, { name: content.name.trim(), updatedAt: new Date().toISOString() });
    return toResponse(row);
  },

  remove: (req: RequestOptions) => {
    const row = find(req);
    savedQueryRows.splice(savedQueryRows.indexOf(row), 1);
    return { message: 'Saved query deleted successfully' };
  },
};
