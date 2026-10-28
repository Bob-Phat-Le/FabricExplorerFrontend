import { CHECKING } from '@/lib/api/stream';
import { TONES, type Tone } from '../constants';

export function StatusBadge({ label, tone = 'muted', title }: { label: string; tone?: Tone; title?: string }) {
  const checking = label === CHECKING;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${TONES[checking ? 'info' : tone]}`}
      title={title || undefined}
    >
      {checking ? <i className="fa-solid fa-circle-notch fa-spin mr-1 text-[10px]" /> : '● '}
      {label}
    </span>
  );
}
