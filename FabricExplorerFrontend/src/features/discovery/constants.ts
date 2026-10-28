export type Tone = 'ok' | 'info' | 'warn' | 'bad' | 'muted';

export const TONES: Record<Tone, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  bad: 'bg-rose-50 text-rose-700 border-rose-200',
  muted: 'bg-slate-50 text-slate-600 border-slate-200',
};

export const TABLE_STATUS_TONE: Record<string, Tone> = { Healthy: 'ok', Empty: 'muted', Stale: 'warn', Error: 'bad', Unknown: 'muted' };
export const ONLINE_STATUS_TONE: Record<string, Tone> = { Online: 'ok', Offline: 'bad', Unknown: 'muted' };
export const DB_STATUS_TONE: Record<string, Tone> = { Active: 'ok', Offline: 'bad', Unknown: 'muted' };
export const MIRRORING_STATUS_TONE: Record<string, Tone> = {
  Running: 'ok', Starting: 'info', Initializing: 'info', Stopping: 'warn', Stopped: 'muted', Paused: 'muted', Initialized: 'muted', Unknown: 'muted',
};
export const TABLE_MIRRORING_TONE: Record<string, Tone> = {
  Replicating: 'ok', Snapshotting: 'info', Reseeding: 'info', Initialized: 'info', Stopped: 'muted', Failed: 'bad', Unknown: 'muted',
};

export const MASK = '••••••••••••••••••••••••••••••••••••••••';

export const STATUS_POLL_MS = 4000;
export const STATUS_POLL_MAX = 15;

export type ResourceType = 'lakehouse' | 'warehouse' | 'mirrored';
