import type { LandingZoneItem, LandingZoneSortField } from '@/types/landingZone';

export const PAGE_SIZE = 10;

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${parseFloat((bytes / 1024 ** i).toFixed(1))} ${units[i]}`;
}

export const nameOf = (path: string) => path.slice(path.lastIndexOf('/') + 1);
export const parentOf = (path: string) => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '');
export const joinPath = (...parts: string[]) => parts.filter(Boolean).join('/');
export const displayPath = (path: string) => `/${path}`;

/** Splits "a/b/c" into the folders to walk through: ["a", "a/b", "a/b/c"]. */
export function pathTrail(path: string): { name: string; path: string }[] {
  const parts = path.split('/').filter(Boolean);
  return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }));
}

export const isInside = (path: string, ancestor: string) => ancestor === '' || path === ancestor || path.startsWith(`${ancestor}/`);

/** Characters not allowed in a file or folder name. */
export const INVALID_NAME = /[\\/:*?"<>|]/;

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required.';
  if (trimmed === '.' || trimmed === '..' || INVALID_NAME.test(trimmed)) return 'Enter a valid name without special characters (\\ / : * ? " < > |).';
  if (trimmed.length > 255) return 'Name is longer than 255 characters.';
  return null;
}

export interface FileIcon {
  icon: string;
  color: string;
  bg: string;
}

export function iconOf(item: Pick<LandingZoneItem, 'isFolder' | 'extension'>): FileIcon {
  if (item.isFolder) return { icon: 'fa-solid fa-folder', color: 'text-amber-500', bg: 'bg-amber-50' };
  switch (item.extension) {
    case 'csv':
    case 'tsv':
      return { icon: 'fa-solid fa-file-csv', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    case 'json':
    case 'jsonl':
      return { icon: 'fa-solid fa-file-code', color: 'text-indigo-600', bg: 'bg-indigo-50' };
    case 'parquet':
      return { icon: 'fa-solid fa-layer-group', color: 'text-purple-600', bg: 'bg-purple-50' };
    case 'txt':
    case 'md':
    case 'log':
      return { icon: 'fa-regular fa-file-lines', color: 'text-slate-600', bg: 'bg-slate-100' };
    default:
      return { icon: 'fa-regular fa-file', color: 'text-slate-500', bg: 'bg-slate-100' };
  }
}

export function sortItems(items: LandingZoneItem[], field: LandingZoneSortField, asc: boolean): LandingZoneItem[] {
  return [...items].sort((a, b) => {
    // folders always first
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    let cmp = 0;
    if (field === 'name') cmp = a.name.localeCompare(b.name);
    else if (field === 'type') cmp = (a.extension ?? '').localeCompare(b.extension ?? '');
    else if (field === 'size') cmp = (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
    else cmp = (a.lastModified ?? '').localeCompare(b.lastModified ?? '');
    return asc ? cmp : -cmp;
  });
}

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
