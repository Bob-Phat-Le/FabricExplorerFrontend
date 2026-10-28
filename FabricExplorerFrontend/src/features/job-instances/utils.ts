import type { FabricItem } from '@/types/fabric';

export function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms)) return '—';
  const total = Math.max(0, Math.round(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 60))}m ${pad(total % 60)}s`;
}

export function itemIcon(type: FabricItem['type']): string {
  switch (type) {
    case 'Warehouse':
      return 'fa-warehouse';
    case 'MirroredDatabase':
      return 'fa-arrows-rotate';
    default:
      return 'fa-building-columns';
  }
}

export const shortId = (id: string) => `${id.substring(0, 8)}...`;
