const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export const EMPTY = '—';

type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatNumber(value: number | string | null | undefined): string {
  return value === null || value === undefined ? EMPTY : Number(value).toLocaleString();
}

export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return d ? dateTimeFormat.format(d) : EMPTY;
}

export function timeAgo(value: DateInput): string {
  const d = toDate(value);
  if (!d) return EMPTY;
  const seconds = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (seconds < 45) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days <= 7 ? `${days} day${days === 1 ? '' : 's'} ago` : dateTimeFormat.format(d);
}

export function formatSeconds(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return EMPTY;
  const s = Number(value);
  if (s < 60) return `${s} sec`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  return `${(s / 3600).toFixed(1).replace(/\.0$/, '')} hr`;
}
