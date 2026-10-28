import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { useClickOutside } from '@/hooks/useClickOutside';
import { ReadyBadge, StepCard } from '@/components/ui/StepCard';
import { Toggle } from '@/components/ui/Toggle';
import { NextButton, Notice, PrevButton, SettingRow, WizardFooter } from '@/components/ui/WizardFooter';
import type { ChangeType, ReplicationConfig, ReplPayloadFormat } from '@/types/replication';
import { CHANGE_TYPES, DATABASES, PAYLOAD_DESCRIPTIONS, PK_COLUMNS, SCHEMAS, SOURCE_FIELDS, TABLES } from '../constants';

export interface StepProps {
  config: ReplicationConfig;
  update: (patch: Partial<ReplicationConfig>) => void;
  onPrev: () => void;
  onNext: () => void;
}

const SELECT = 'w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none';

export const workspaceOf = (database: string) => DATABASES.find((d) => d.value === database)?.workspace ?? '';

/* ---------------------------------------------------------------- Step 1 */
export function StepDatabase({ config, update, onNext }: StepProps) {
  return (
    <StepCard
      number={1}
      total={6}
      title="Target Mirrored Database"
      description="Select the Fabric Mirrored Database that will receive the replicated data."
    >
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Mirrored Database ID <span className="text-rose-500">*</span>
        </label>
        <select value={config.database} onChange={(e) => update({ database: e.target.value })} className={SELECT}>
          {DATABASES.map((d) => (
            <option key={d.value} value={d.value}>{`${d.value} (${d.workspace} Workspace)`}</option>
          ))}
        </select>
      </div>

      {/* Selected DB Info Badge */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm shrink-0 font-bold">
            <i className="fa-solid fa-arrows-split-up-and-left rotate-90" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm">{config.database}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Workspace: <span className="font-medium text-slate-700">{workspaceOf(config.database)}</span>
            </p>
          </div>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
          Active Target
        </span>
      </div>

      <WizardFooter>
        <NextButton onClick={onNext}>Next: Source Table</NextButton>
      </WizardFooter>
    </StepCard>
  );
}

/* ---------------------------------------------------------------- Step 2 */
export function StepSource({ config, update, onPrev, onNext }: StepProps) {
  return (
    <StepCard number={2} total={6} title="Source Table" description="Specify the schema and table entity that will be replicated.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Schema Name <span className="text-rose-500">*</span>
          </label>
          <select value={config.schema} onChange={(e) => update({ schema: e.target.value })} className={SELECT}>
            {SCHEMAS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Table Name <span className="text-rose-500">*</span>
          </label>
          <select value={config.table} onChange={(e) => update({ table: e.target.value })} className={SELECT}>
            {TABLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SAFETY WARNING: EXISTING REPLICATION DETECTED */}
      {config.table === 'Customers' && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-3">
          <i className="fa-solid fa-triangle-exclamation text-amber-600 text-base mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Existing Replication Stream Detected:</span>
            <span className="text-amber-800">
              {' '}
              Table <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{`${config.schema}.${config.table}`}</code> already has an
              active replication stream running.
            </span>
          </div>
        </div>
      )}

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Metadata</NextButton>
      </WizardFooter>
    </StepCard>
  );
}

/* ---------------------------------------------------------------- Step 3 */
export function StepMetadata({ config, update, onPrev, onNext }: StepProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const togglePk = (col: string) =>
    update({ primaryKeys: config.primaryKeys.includes(col) ? config.primaryKeys.filter((c) => c !== col) : [...config.primaryKeys, col] });

  return (
    <StepCard
      number={3}
      total={6}
      title="Auto-Create _metadata.json"
      description="Automatically generate schema manifest metadata required for Open Mirroring."
    >
      <SettingRow
        title="Auto-Create _metadata.json"
        description="Generates JSON metadata containing column definitions and primary key indexes."
      >
        <Toggle checked={config.autoMetadata} onChange={(autoMetadata) => update({ autoMetadata })} />
      </SettingRow>

      {!config.autoMetadata ? (
        <Notice>Metadata will not be automatically generated. You must supply a custom schema metadata manifest manually.</Notice>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">
              Primary Key Columns <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Specify columns used to identify unique records</span>
          </div>

          {/* Selected PK Chips Display */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-h-[46px] flex flex-wrap items-center gap-2">
            {config.primaryKeys.length === 0 ? (
              <span className="text-slate-400 text-xs italic">No primary keys selected</span>
            ) : (
              config.primaryKeys.map((col) => (
                <span key={col} className="bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                  <span>{col}</span>
                  <button type="button" onClick={() => togglePk(col)} className="hover:text-indigo-900">
                    <i className="fa-solid fa-xmark text-[10px]" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Column Selector Multi-Select Dropdown */}
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center justify-between font-semibold"
            >
              <span>
                <i className="fa-solid fa-key text-indigo-500 mr-2" />
                Select Primary Key Columns...
              </span>
              <i className="fa-solid fa-chevron-down text-slate-400 text-[10px]" />
            </button>
            {open && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1">
                {PK_COLUMNS.map((col) => (
                  <div
                    key={col}
                    onClick={() => togglePk(col)}
                    className="px-3 py-1.5 hover:bg-slate-50 rounded text-xs flex items-center justify-between cursor-pointer"
                  >
                    <span>{col}</span>
                    <i className={cn('fa-solid fa-check text-indigo-600 text-xs', !config.primaryKeys.includes(col) && 'hidden')} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Payload Format</NextButton>
      </WizardFooter>
    </StepCard>
  );
}

/* ---------------------------------------------------------------- Step 4 */
const FMT_BASE = 'p-4 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-2 transition-all';
const FMT_ON = `${FMT_BASE} border-2 border-indigo-600 bg-indigo-50/50 text-indigo-700`;
const FMT_OFF = `${FMT_BASE} border border-slate-200 bg-white text-slate-700 hover:border-indigo-300`;

export function StepPayload({ config, update, onPrev, onNext }: StepProps) {
  const formats: { value: ReplPayloadFormat; icon: string }[] = [
    { value: 'Parquet', icon: 'fa-box' },
    { value: 'CSV', icon: 'fa-file-csv' },
  ];
  return (
    <StepCard
      number={4}
      total={6}
      title="Payload Format"
      description="Choose the serialization format used for replicated payload data."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        {formats.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => update({ payloadFormat: f.value })}
            className={config.payloadFormat === f.value ? FMT_ON : FMT_OFF}
          >
            <i className={`fa-solid ${f.icon} text-2xl`} />
            <span className="text-sm">{f.value}</span>
          </button>
        ))}
      </div>

      <p className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
        {PAYLOAD_DESCRIPTIONS[config.payloadFormat]}
      </p>

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Row Marker</NextButton>
      </WizardFooter>
    </StepCard>
  );
}

/* ---------------------------------------------------------------- Step 5 */
const CHIP_BASE = 'px-3.5 py-2 rounded-xl text-xs border transition-all';
const CHIP_ON = `${CHIP_BASE} font-bold border-indigo-600 bg-indigo-50 text-indigo-700`;
const CHIP_OFF = `${CHIP_BASE} font-medium border-slate-200 bg-white text-slate-600 hover:border-indigo-300`;

/** "None" loại trừ các kiểu còn lại; bỏ chọn hết thì quay về ["None"]. */
export function nextChangeTypes(current: ChangeType[], type: ChangeType): ChangeType[] {
  if (type === 'None') return ['None'];
  const without = current.filter((t) => t !== 'None');
  const next = without.includes(type) ? without.filter((t) => t !== type) : [...without, type];
  return next.length === 0 ? ['None'] : next;
}

export function StepRowMarker({ config, update, onPrev, onNext }: StepProps) {
  return (
    <StepCard
      number={5}
      total={6}
      title="Row Marker (CDC Tracking)"
      description="Include row-level change information in the replicated payload to track updates."
    >
      <SettingRow
        title="Enable Row Marker"
        description="A row marker helps identify row modifications during replication synchronization."
      >
        <Toggle checked={config.rowMarkerEnabled} onChange={(rowMarkerEnabled) => update({ rowMarkerEnabled })} />
      </SettingRow>

      {!config.rowMarkerEnabled ? (
        <div className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
          <i className="fa-solid fa-info-circle mr-1 text-indigo-500" /> Row-level change tracking is disabled. Replicated files will
          contain state snapshots without change markers.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Source Field <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <select
                value={config.sourceField}
                onChange={(e) => update({ sourceField: e.target.value })}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {SOURCE_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <div className="px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 shrink-0">
                Type: <strong className="text-indigo-600">DateTime</strong>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Change Types <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Select change types to mark during synchronization</span>
            </div>
            <div className="flex items-center space-x-2 flex-wrap gap-2">
              {CHANGE_TYPES.map((ct) => {
                const on = config.changeTypes.includes(ct);
                return (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => update({ changeTypes: nextChangeTypes(config.changeTypes, ct) })}
                    className={on ? CHIP_ON : CHIP_OFF}
                  >
                    {on ? `${ct} ✓` : ct}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <WizardFooter onPrev={onPrev}>
        <NextButton onClick={onNext}>Next: Review & Start</NextButton>
      </WizardFooter>
    </StepCard>
  );
}

/* ---------------------------------------------------------------- Step 6 */
function ReviewBox({ title, step, goTo, children, className = '' }: { title: string; step: number; goTo: (s: number) => void; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 ${className}`}>
      <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
        <span className="font-bold text-slate-800">{title}</span>
        <button type="button" onClick={() => goTo(step)} className="text-indigo-600 hover:underline font-semibold text-[11px]">
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

const Line = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <p className="text-slate-600">
    <span className="text-slate-400">{label}:</span> <strong className={cn('text-slate-900', mono && 'font-mono')}>{value}</strong>
  </p>
);

export function StepReview({
  config,
  goTo,
  onPrev,
  onStart,
}: {
  config: ReplicationConfig;
  goTo: (step: number) => void;
  onPrev: () => void;
  onStart: () => void;
}) {
  return (
    <StepCard
      number={6}
      total={6}
      title="Review Configuration & Trigger Replication"
      description="Verify Open Mirroring parameters before initializing stream replication."
      badge={<ReadyBadge>Ready to Replicate</ReadyBadge>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <ReviewBox title="1. Target Mirrored Database" step={1} goTo={goTo}>
          <Line label="Database ID" value={config.database} mono />
          <Line label="Workspace" value={workspaceOf(config.database)} />
        </ReviewBox>
        <ReviewBox title="2. Source Entity" step={2} goTo={goTo}>
          <Line label="Schema / Table" value={`${config.schema}.${config.table}`} mono />
        </ReviewBox>
        <ReviewBox title="3. Metadata Manifest" step={3} goTo={goTo}>
          <Line label="Auto-Create" value={config.autoMetadata ? 'Enabled' : 'Disabled'} />
          <Line label="Primary Keys" value={config.primaryKeys.join(', ') || 'None'} mono />
        </ReviewBox>
        <ReviewBox title="4. Payload Format" step={4} goTo={goTo}>
          <Line label="Serialization" value={config.payloadFormat} />
        </ReviewBox>
        <ReviewBox title="5. Row Marker (CDC)" step={5} goTo={goTo} className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Line label="Row Marker Status" value={config.rowMarkerEnabled ? 'Enabled' : 'Disabled'} />
            <Line
              label="Source Field / Changes"
              value={config.rowMarkerEnabled ? `${config.sourceField} (${config.changeTypes.join(', ')})` : 'N/A'}
              mono
            />
          </div>
        </ReviewBox>
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-100">
        <PrevButton onClick={onPrev} />
        <button
          type="button"
          onClick={onStart}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md flex items-center space-x-2"
        >
          <i className="fa-solid fa-play" />
          <span>Start Replication</span>
        </button>
      </div>
    </StepCard>
  );
}
