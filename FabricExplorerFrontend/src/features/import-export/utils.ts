import type {
  ConfigEntryType,
  ConfigurationCapabilities,
  ConfigurationFileDocument,
  ImportAction,
  MatchInfo,
} from '@/types/configuration';

export const TYPE_LABEL: Record<ConfigEntryType, string> = {
  Connection: 'Connection',
  SavedQuery: 'Saved Query',
};

export const typeLabel = (type: string) => TYPE_LABEL[type as ConfigEntryType] ?? type;

export const selectionKey = (type: string, id: string) => `${type}:${id}`;
export const entryKey = (type: string, key: string | null | undefined) => `${type}|${(key ?? '').toLowerCase()}`;

export type Tone = 'emerald' | 'amber' | 'rose' | 'slate' | 'indigo';

export const TONE_CLASS: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

/** Inventory status -> label. Connections report credentials, saved queries report their connection. */
export function statusMeta(status: string): { label: string; tone: Tone; icon: string } {
  switch (status) {
    case 'Configured':
      return { label: 'Credentials OK', tone: 'emerald', icon: 'fa-key' };
    case 'Missing':
      return { label: 'Needs credentials', tone: 'amber', icon: 'fa-triangle-exclamation' };
    case 'Resolved':
      return { label: 'Resolved', tone: 'emerald', icon: 'fa-link' };
    case 'Unresolved':
      return { label: 'Unresolved connection', tone: 'rose', icon: 'fa-link-slash' };
    default:
      return { label: status, tone: 'slate', icon: 'fa-circle' };
  }
}

export const ACTION_META: Record<ImportAction, { label: string; tone: Tone }> = {
  created: { label: 'Created', tone: 'emerald' },
  updated: { label: 'Updated', tone: 'amber' },
  skipped: { label: 'Skipped', tone: 'slate' },
  failed: { label: 'Failed', tone: 'rose' },
};

export function flagLabel(flag: string): string {
  switch (flag) {
    case 'NeedsCredentials':
      return 'Client secret must be entered after import';
    case 'CredentialsResetOnOverwrite':
      return 'Client or tenant differs: the stored secret will be cleared';
    default:
      return flag;
  }
}

export function matchLabel(match: MatchInfo): { label: string; tone: Tone; hint?: string } {
  if (match.kind === 'exact') return { label: 'Already exists', tone: 'amber', hint: 'matched by key' };
  if (match.kind === 'probable')
    return { label: 'Probable match', tone: 'amber', hint: match.by ? `matched by ${match.by}` : undefined };
  return { label: 'New', tone: 'emerald' };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function previewFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `fabric-explorer-configuration-${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}-${p(date.getUTCHours())}${p(date.getUTCMinutes())}.json`;
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Raised for problems found in the file before anything is sent to the server. */
export class FileCheckError extends Error {}

/** Quick local checks (size, JSON, format marker, version) so obvious mistakes never reach the server. */
export async function readConfigurationFile(
  file: File,
  caps: ConfigurationCapabilities,
): Promise<ConfigurationFileDocument> {
  if (file.size === 0) throw new FileCheckError('The file is empty.');
  if (file.size > caps.maxFileSizeBytes)
    throw new FileCheckError(`The file is ${formatBytes(file.size)}; the limit is ${formatBytes(caps.maxFileSizeBytes)}.`);

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new FileCheckError('The file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new FileCheckError('The configuration file must be a JSON object.');

  const doc = parsed as ConfigurationFileDocument;
  if (doc.format !== caps.format) throw new FileCheckError(`This is not a "${caps.format}" file.`);

  if (!Number.isInteger(doc.formatVersion) || (doc.formatVersion as number) < 1)
    throw new FileCheckError('The file has no valid "formatVersion".');
  if (!caps.supportedFormatVersions.includes(doc.formatVersion as number))
    throw new FileCheckError(
      `Format version ${doc.formatVersion} is not supported (supported: ${caps.supportedFormatVersions.join(', ')}).`,
    );

  for (const [name, list] of [
    ['connections', doc.connections],
    ['savedQueries', doc.savedQueries],
  ] as const) {
    if (list !== undefined && list !== null && !Array.isArray(list))
      throw new FileCheckError(`"${name}" must be a list.`);
    if ((list?.length ?? 0) > caps.maxEntriesPerType)
      throw new FileCheckError(`"${name}" has more than ${caps.maxEntriesPerType} entries.`);
  }

  return doc;
}
