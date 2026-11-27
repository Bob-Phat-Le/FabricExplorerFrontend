import { ApiError, type RequestOptions } from '../api/client';
import { savedQueryRows as queries } from './savedQueryStore';
import * as seeds from './seeds';
import type {
  ConfigurationCapabilities,
  ConfigurationFileDocument,
  ConfigurationHistoryItem,
  ConfigurationItem,
  ExportRequest,
  ImportRequest,
  ImportResponse,
  ImportResultItem,
  PreviewEntry,
  PreviewResponse,
} from '@/types/configuration';

/** In-memory import / export used when NEXT_PUBLIC_USE_MOCK=true. */

const FORMAT = 'fabric-explorer.configuration';
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400e3).toISOString();

const CONNECTION_KEYS: Record<string, string> = {
  'conn-1': '6f0c1c52-3b7e-4a43-9d57-2f6c8e1a9b10',
  'conn-2': '0b7a4d2e-91c8-4f6a-8e33-5d1f7b2c6a44',
};

interface FileQuery {
  description?: string | null;
  connectionKey?: string;
  target?: { itemType?: string; itemId?: string; itemName?: string };
  sql?: string;
  maxRows?: number | null;
}

const keyOfConnection = (id: string) => CONNECTION_KEYS[id] ?? id;
const missingSecret = new Set<string>();

const inventory = (): ConfigurationItem[] => [
  ...seeds.connections.map(
    (c): ConfigurationItem => ({
      type: 'Connection',
      id: c.id,
      key: keyOfConnection(c.id),
      name: c.name,
      source: c.workspaceId,
      parentName: null,
      updatedAt: iso(c.id === 'conn-1' ? 6 : 8),
      status: missingSecret.has(c.id) ? 'Missing' : 'Configured',
      issues: missingSecret.has(c.id) ? ['credentials_missing'] : [],
    }),
  ),
  ...queries.map((q): ConfigurationItem => {
    const conn = seeds.connections.find((c) => c.id === q.connectionId);
    return {
      type: 'SavedQuery',
      id: q.id,
      key: q.key,
      name: q.name,
      source: `${q.itemType}: ${q.itemName}`,
      parentName: conn?.name ?? null,
      updatedAt: q.updatedAt ?? q.createdAt,
      status: conn ? 'Resolved' : 'Unresolved',
      issues: conn ? [] : ['connection_unresolved'],
    };
  }),
];

const history: ConfigurationHistoryItem[] = [];
const record = (kind: string, summary: string, itemCount: number) =>
  history.unshift({ id: crypto.randomUUID(), kind, status: 'Completed', summary, itemCount, createdAt: new Date().toISOString() });

const replay = new Map<string, ImportResponse>();

const fileName = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `fabric-explorer-configuration-${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}.json`;
};

export const configurationMocks = {
  capabilities: (): ConfigurationCapabilities => ({
    format: FORMAT,
    supportedFormatVersions: [1],
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxEntriesPerType: 1000,
    types: [
      { type: 'Connection', collection: 'connections' },
      { type: 'SavedQuery', collection: 'savedQueries' },
    ],
    importModes: ['merge', 'overwrite'],
  }),

  items: (req: RequestOptions) => {
    const q = req.query ?? {};
    const page = Math.max(1, Number(q.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 20)));
    const term = String(q.search ?? '').toLowerCase();

    const filtered = inventory()
      .filter((i) => !q.type || i.type.toLowerCase() === String(q.type).toLowerCase())
      .filter((i) => !q.status || i.status.toLowerCase() === String(q.status).toLowerCase())
      .filter(
        (i) =>
          !term ||
          i.name.toLowerCase().includes(term) ||
          (i.source ?? '').toLowerCase().includes(term) ||
          (i.parentName ?? '').toLowerCase().includes(term),
      )
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      pageInformation: {
        page,
        pageSize,
        totalItems: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  },

  exportFile: (body: ExportRequest) => {
    const all = body.scope === 'all';
    const picked = new Set((body.items ?? []).map((i) => `${i.type}:${i.id}`));
    const selectedQueries = queries.filter((q) => all || picked.has(`SavedQuery:${q.id}`));
    const connectionIds = new Set([
      ...seeds.connections.filter((c) => all || picked.has(`Connection:${c.id}`)).map((c) => c.id),
      ...selectedQueries.map((q) => q.connectionId),
    ]);
    const connections = seeds.connections
      .filter((c) => connectionIds.has(c.id))
      .map((c) => ({
        key: keyOfConnection(c.id),
        name: c.name,
        environment: c.environment ?? null,
        workspaceId: c.workspaceId,
        workspaceName: null,
        tenantId: c.tenantId,
        tokenEndpoint: c.tokenEndpoint ?? `https://login.microsoftonline.com/${c.tenantId}/oauth2/v2.0/token`,
        clientId: c.clientId,
        credentials: { clientSecret: 'excluded' },
        landingZone: body.include.landingZone
          ? { uri: 'abfss://landing@onelake.dfs.fabric.microsoft.com/Mock.MountedRelationalDatabase/Files/LandingZone' }
          : null,
        createdAt: iso(40),
        updatedAt: iso(6),
      }));
    const savedQueries = selectedQueries.map((q) => ({
      key: q.key,
      name: q.name,
      description: q.description,
      connectionKey: keyOfConnection(q.connectionId),
      target: { itemType: q.itemType, itemId: q.itemId, itemName: q.itemName },
      language: 'tsql',
      sql: q.sql,
      maxRows: q.maxRows,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
    }));

    if (!all && connections.length + savedQueries.length === 0)
      throw new ApiError('None of the selected items exist.', { status: 404, code: 'configuration.invalid_selection' });

    const doc = {
      format: FORMAT,
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      app: { name: 'Fabric Explorer', version: '1.0.0' },
      scope: body.scope,
      contents: { connections: connections.length, savedQueries: savedQueries.length },
      connections,
      savedQueries,
      preferences: null,
      integrity: { algorithm: 'sha256', value: 'mock' },
    };
    record('Export', `Exported ${connections.length} connection(s) and ${savedQueries.length} saved query(ies).`, connections.length + savedQueries.length);
    return { content: JSON.stringify(doc, null, 2), fileName: fileName(), exported: connections.length + savedQueries.length };
  },

  preview: (req: RequestOptions): PreviewResponse => {
    const doc = (req.body as { document: ConfigurationFileDocument }).document;
    if (!doc || doc.format !== FORMAT)
      return { formatVersion: null, integrityValid: true, fileErrors: [{ code: 'configuration.invalid_format', message: `The file is not a '${FORMAT}' document.` }], entries: [], summary: { total: 0, new: 0, existing: 0, invalid: 0 } };

    const fileConnections = doc.connections ?? [];
    const entries: PreviewEntry[] = [];

    for (const c of fileConnections) {
      const errors = [];
      if (!c.name) errors.push({ code: 'required', field: 'name', message: 'Name is required.' });
      if (!GUID.test(String(c.workspaceId ?? ''))) errors.push({ code: 'invalid_guid', field: 'workspaceId', message: 'Workspace id must be a GUID.' });
      const existing = seeds.connections.find((x) => keyOfConnection(x.id) === c.key) ?? seeds.connections.find((x) => x.workspaceId === c.workspaceId);
      const exact = existing && keyOfConnection(existing.id) === c.key;
      entries.push({
        type: 'Connection',
        key: c.key,
        name: c.name,
        match: existing ? { kind: exact ? 'exact' : 'probable', existingId: existing.id, by: exact ? 'key' : 'workspaceId' } : { kind: 'none' },
        validation: { valid: errors.length === 0, errors },
        flags: existing ? (existing.clientId !== c.clientId ? ['CredentialsResetOnOverwrite'] : []) : ['NeedsCredentials'],
      });
    }

    for (const q of doc.savedQueries ?? []) {
      const errors = [];
      if (!q.name) errors.push({ code: 'required', field: 'name', message: 'Name is required.' });
      if (!String(q.sql ?? '').trim()) errors.push({ code: 'required', field: 'sql', message: 'SQL must not be empty.' });
      const known = seeds.connections.some((c) => keyOfConnection(c.id) === q.connectionKey);
      const inFile = fileConnections.some((c) => c.key === q.connectionKey);
      if (!known && !inFile) errors.push({ code: 'reference_unresolved', field: 'connectionKey', message: 'Connection not in file or system' });
      const existing = queries.find((x) => x.key === q.key);
      entries.push({
        type: 'SavedQuery',
        key: q.key,
        name: q.name,
        match: existing ? { kind: 'exact', existingId: existing.id, by: 'key' } : { kind: 'none' },
        validation: { valid: errors.length === 0, errors },
        flags: [],
      });
    }

    return {
      formatVersion: doc.formatVersion ?? 1,
      integrityValid: doc.integrity ? (doc.integrity as { value?: string }).value !== 'tampered' : true,
      fileErrors: [],
      entries,
      summary: {
        total: entries.length,
        new: entries.filter((e) => e.validation.valid && e.match.kind === 'none').length,
        existing: entries.filter((e) => e.validation.valid && e.match.kind !== 'none').length,
        invalid: entries.filter((e) => !e.validation.valid).length,
      },
    };
  },

  import: (req: RequestOptions): ImportResponse => {
    const idem = req.headers?.['Idempotency-Key'];
    if (idem && replay.has(idem)) return replay.get(idem)!;

    const body = req.body as ImportRequest;
    const preview = configurationMocks.preview({ ...req, body: { document: body.document } });
    const chosen = new Set(body.selection.map((s) => `${s.type}|${s.key}`));
    const results: ImportResultItem[] = [];

    for (const e of preview.entries) {
      if (!chosen.has(`${e.type}|${e.key}`)) continue;
      const exists = e.match.kind !== 'none';
      const mapped = body.options.referenceMappings ?? {};
      const entryErrors = e.validation.errors.filter(
        (x) => !(x.code === 'reference_unresolved' && Object.keys(mapped).length > 0),
      );
      if (entryErrors.length > 0) {
        results.push({ type: e.type, key: e.key, name: e.name, action: 'failed', success: false, error: { code: entryErrors[0].code, message: entryErrors[0].message }, flags: [] });
        continue;
      }
      const action = exists ? (body.mode === 'overwrite' ? 'updated' : 'skipped') : 'created';
      let id = e.match.existingId ?? null;

      if (action === 'updated' && e.type === 'SavedQuery') {
        const src = body.document.savedQueries?.find((q) => q.key === e.key) as FileQuery | undefined;
        const row = queries.find((q) => q.id === e.match.existingId);
        if (row && src)
          Object.assign(row, {
            name: String(e.name),
            description: src.description ?? null,
            itemType: src.target?.itemType ?? row.itemType,
            itemId: src.target?.itemId ?? row.itemId,
            itemName: src.target?.itemName ?? row.itemName,
            sql: src.sql ?? row.sql,
            maxRows: src.maxRows ?? null,
            updatedAt: new Date().toISOString(),
          });
      }

      if (action === 'created') {
        if (e.type === 'Connection') {
          const src = body.document.connections?.find((c) => c.key === e.key) as Record<string, string> | undefined;
          id = `conn-${Date.now()}-${results.length}`;
          CONNECTION_KEYS[id] = String(e.key);
          missingSecret.add(id);
          seeds.connections.push({
            id,
            name: String(e.name),
            workspaceId: src?.workspaceId ?? '',
            workspaceName: src?.workspaceName ?? src?.workspaceId ?? '',
            tenantId: src?.tenantId,
            clientId: src?.clientId,
            environment: src?.environment ?? null,
            isActive: false,
          });
        } else {
          const src = body.document.savedQueries?.find((q) => q.key === e.key) as FileQuery | undefined;
          const connectionId =
            mapped[String(src?.connectionKey)] ??
            seeds.connections.find((c) => keyOfConnection(c.id) === src?.connectionKey)?.id ??
            '';
          id = `sq-${Date.now()}-${results.length}`;
          queries.push({
            id,
            key: String(e.key),
            name: String(e.name),
            description: src?.description ?? null,
            connectionId,
            itemType: src?.target?.itemType ?? 'Lakehouse',
            itemId: src?.target?.itemId ?? '',
            itemName: src?.target?.itemName ?? '',
            sql: src?.sql ?? '',
            maxRows: src?.maxRows ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
          });
        }
      }

      results.push({
        type: e.type,
        key: e.key,
        name: e.name,
        action,
        id,
        success: true,
        error: null,
        flags: action === 'created' && e.type === 'Connection' ? ['NeedsCredentials'] : [],
      });
    }

    const count = (a: string) => results.filter((r) => r.action === a).length;
    const response: ImportResponse = {
      created: count('created'),
      updated: count('updated'),
      skipped: count('skipped'),
      failed: count('failed'),
      results,
    };
    record('Import', `Imported ${response.created} created, ${response.updated} updated, ${response.skipped} skipped.`, results.length);
    if (idem) replay.set(idem, response);
    return response;
  },

  history: () => history.slice(0, 10),
};
