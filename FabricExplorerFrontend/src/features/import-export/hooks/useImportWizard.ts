import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as configurationApi from '@/lib/api/configuration.api';
import type {
  ConfigurationCapabilities,
  ConfigurationFileDocument,
  ConfigurationItem,
  ImportMode,
  ImportResponse,
  PreviewEntry,
  PreviewResponse,
} from '@/types/configuration';
import type { FileSavedQuery } from '@/types/FileSavedQuery';
import { FileCheckError, entryKey, readConfigurationFile } from '../utils';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type PlanAction = 'create' | 'update' | 'skip';

export interface PlanRow {
  entry: PreviewEntry;
  action: PlanAction;
  /** Why an entry is skipped even though it was chosen. */
  reason?: string;
}

const lower = (s: string | null | undefined) => (s ?? '').trim().toLowerCase();
const errMessage = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

export function useImportWizard(caps: ConfigurationCapabilities, onImported: () => void) {
  const [step, setStep] = useState<WizardStep>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [document, setDocument] = useState<ConfigurationFileDocument | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [fileIssues, setFileIssues] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);

  const [selected, setSelectedState] = useState<ReadonlySet<string>>(() => new Set());
  const [mappings, setMappings] = useState<Readonly<Record<string, string>>>({});
  const [mode, setModeState] = useState<ImportMode>('merge');
  const [restoreLandingZone, setRestoreLandingZone] = useState(true);
  const [atomic, setAtomic] = useState(false);
  const [ignoreIntegrity, setIgnoreIntegrity] = useState(false);

  const [existingConnections, setExistingConnections] = useState<ConfigurationItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResponse | null>(null);

  /** One Idempotency-Key per attempt: a retry of the same inputs is safe, changed inputs get a new key. */
  const attemptKey = useRef<string | null>(null);
  const invalidateAttempt = useCallback(() => {
    attemptKey.current = null;
    setImportError(null);
  }, []);

  const checkRun = useRef(0);

  // ---------- derived ----------

  const entries = useMemo(() => preview?.entries ?? [], [preview]);

  /** The saved query of the file a preview entry stands for (target, SQL, limits). */
  const savedQueryOf = useCallback(
    (entry: PreviewEntry): FileSavedQuery | null =>
      entry.type === 'SavedQuery' ? (document?.savedQueries?.find((x) => lower(x.key) === lower(entry.key)) ?? null) : null,
    [document],
  );

  const connectionKeyOf = useCallback(
    (entry: PreviewEntry) => {
      const q = savedQueryOf(entry);
      return q?.connectionKey ? lower(q.connectionKey) : null;
    },
    [savedQueryOf],
  );

  const mappedConnection = useCallback(
    (entry: PreviewEntry) => {
      const ck = connectionKeyOf(entry);
      return ck ? mappings[ck] : undefined;
    },
    [connectionKeyOf, mappings],
  );

  /** Name of the existing connection a saved query was mapped to, if any. */
  const mappedConnectionLabel = useCallback(
    (entry: PreviewEntry) => {
      const id = mappedConnection(entry);
      return id ? (existingConnections.find((c) => c.id === id)?.name ?? id) : null;
    },
    [mappedConnection, existingConnections],
  );

  /** Validation errors that are still open once the chosen connection mappings are applied. */
  const openErrors = useCallback(
    (entry: PreviewEntry) =>
      entry.validation.errors.filter((e) => !(e.code === 'reference_unresolved' && mappedConnection(entry))),
    [mappedConnection],
  );

  const isValid = useCallback((entry: PreviewEntry) => !!entry.key && openErrors(entry).length === 0, [openErrors]);

  const stats = useMemo(() => {
    const valid = entries.filter(isValid);
    return {
      total: entries.length,
      isNew: valid.filter((e) => e.match.kind === 'none').length,
      existing: valid.filter((e) => e.match.kind !== 'none').length,
      invalid: entries.length - valid.length,
    };
  }, [entries, isValid]);

  const unresolvedQueries = useMemo(
    () => entries.filter((e) => e.validation.errors.some((x) => x.code === 'reference_unresolved')),
    [entries],
  );

  const isSelected = useCallback((entry: PreviewEntry) => selected.has(entryKey(entry.type, entry.key)), [selected]);

  const selectedEntries = useMemo(() => entries.filter((e) => isValid(e) && isSelected(e)), [entries, isValid, isSelected]);

  const plan = useMemo<PlanRow[]>(() => {
    const connectionEntries = new Map(
      entries.filter((e) => e.type === 'Connection').map((e) => [lower(e.key), e] as const),
    );

    return selectedEntries.map((entry): PlanRow => {
      if (entry.type === 'SavedQuery') {
        const ck = connectionKeyOf(entry);
        const dep = ck ? connectionEntries.get(ck) : undefined;
        if (dep && !mappedConnection(entry) && dep.match.kind === 'none' && !selected.has(entryKey(dep.type, dep.key)))
          return { entry, action: 'skip', reason: `Its connection "${dep.name ?? dep.key}" is in the file but not selected.` };
      }
      const exists = entry.match.kind !== 'none';
      if (!exists) return { entry, action: 'create' };
      return { entry, action: mode === 'overwrite' ? 'update' : 'skip', reason: mode === 'merge' ? 'Already exists (merge keeps it as is).' : undefined };
    });
  }, [selectedEntries, entries, selected, mode, connectionKeyOf, mappedConnection]);

  const planCounts = useMemo(
    () => ({
      create: plan.filter((p) => p.action === 'create').length,
      update: plan.filter((p) => p.action === 'update').length,
      skip: plan.filter((p) => p.action === 'skip').length,
    }),
    [plan],
  );

  /** Connections that will have no usable secret after the import. */
  const needCredentials = useMemo(
    () =>
      plan.filter(
        (p) =>
          p.entry.type === 'Connection' &&
          ((p.action === 'create' && p.entry.flags.includes('NeedsCredentials')) ||
            (p.action === 'update' && p.entry.flags.includes('CredentialsResetOnOverwrite'))),
      ),
    [plan],
  );

  const hasLandingZone = useMemo(
    () =>
      selectedEntries.some(
        (e) =>
          e.type === 'Connection' &&
          !!document?.connections?.find((c) => lower(c.key) === lower(e.key))?.landingZone?.uri,
      ),
    [selectedEntries, document],
  );

  // ---------- actions ----------

  const reset = useCallback(() => {
    checkRun.current++;
    setStep(1);
    setFileName(null);
    setDocument(null);
    setPreview(null);
    setFileIssues([]);
    setChecking(false);
    setSelectedState(new Set());
    setMappings({});
    setModeState('merge');
    setRestoreLandingZone(true);
    setAtomic(false);
    setIgnoreIntegrity(false);
    setImporting(false);
    setResult(null);
    invalidateAttempt();
  }, [invalidateAttempt]);

  const loadFile = useCallback(
    async (file: File) => {
      const run = ++checkRun.current;
      reset();
      checkRun.current = run;
      setFileName(file.name);
      setChecking(true);

      try {
        const doc = await readConfigurationFile(file, caps);
        const res = await configurationApi.previewImport(doc);
        if (run !== checkRun.current) return;

        if (res.fileErrors.length > 0) {
          setFileIssues(res.fileErrors.map((i) => i.message));
          return;
        }
        if (res.entries.length === 0) {
          setFileIssues(['The file has no connections or saved queries to import.']);
          return;
        }

        setDocument(doc);
        setPreview(res);
        setSelectedState(new Set(res.entries.filter((e) => e.key && e.validation.valid).map((e) => entryKey(e.type, e.key))));
        setRestoreLandingZone(true);
        setStep(2);
      } catch (e) {
        if (run !== checkRun.current) return;
        setFileIssues([e instanceof FileCheckError ? e.message : errMessage(e, 'Could not read the file.')]);
      } finally {
        if (run === checkRun.current) setChecking(false);
      }
    },
    [caps, reset],
  );

  // existing connections are only needed when something has to be mapped
  useEffect(() => {
    if (unresolvedQueries.length === 0 || existingConnections.length > 0) return;
    let cancelled = false;
    configurationApi
      .listAllItems({ type: 'Connection' })
      .then((all) => !cancelled && setExistingConnections(all))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [unresolvedQueries.length, existingConnections.length]);

  const toggleEntry = useCallback(
    (entry: PreviewEntry, checked: boolean) => {
      invalidateAttempt();
      setSelectedState((prev) => {
        const next = new Set(prev);
        const k = entryKey(entry.type, entry.key);
        if (checked) next.add(k);
        else next.delete(k);
        return next;
      });
    },
    [invalidateAttempt],
  );

  const selectAllValid = useCallback(
    (checked: boolean) => {
      invalidateAttempt();
      setSelectedState(checked ? new Set(entries.filter(isValid).map((e) => entryKey(e.type, e.key))) : new Set());
    },
    [entries, isValid, invalidateAttempt],
  );

  /** Points the saved queries of a missing connection at an existing one (or clears the mapping). */
  const setMapping = useCallback(
    (fileConnectionKey: string, existingId: string) => {
      invalidateAttempt();
      const ck = lower(fileConnectionKey);
      setMappings((prev) => {
        const next = { ...prev };
        if (existingId) next[ck] = existingId;
        else delete next[ck];
        return next;
      });

      const dependants = entries.filter((e) => e.type === 'SavedQuery' && connectionKeyOf(e) === ck && e.key);
      setSelectedState((prev) => {
        const next = new Set(prev);
        dependants.forEach((e) => {
          const hasRef = e.validation.errors.some((x) => x.code === 'reference_unresolved');
          const stillOpen = e.validation.errors.some((x) => x.code !== 'reference_unresolved');
          if (!hasRef || stillOpen) return;
          const k = entryKey(e.type, e.key);
          if (existingId) next.add(k);
          else next.delete(k);
        });
        return next;
      });
    },
    [entries, connectionKeyOf, invalidateAttempt],
  );

  const setMode = useCallback(
    (m: ImportMode) => {
      invalidateAttempt();
      setModeState(m);
    },
    [invalidateAttempt],
  );

  const setOption = useCallback(
    (name: 'restoreLandingZone' | 'atomic' | 'ignoreIntegrity', value: boolean) => {
      invalidateAttempt();
      if (name === 'restoreLandingZone') setRestoreLandingZone(value);
      else if (name === 'atomic') setAtomic(value);
      else setIgnoreIntegrity(value);
    },
    [invalidateAttempt],
  );

  const canAdvance =
    step === 2
      ? selectedEntries.length > 0 && (!!preview?.integrityValid || ignoreIntegrity)
      : step === 3
        ? true
        : step === 4
          ? !importing && selectedEntries.length > 0
          : false;

  const execute = useCallback(async () => {
    if (!document || selectedEntries.length === 0) return;

    attemptKey.current ??= crypto.randomUUID();
    setImporting(true);
    setImportError(null);

    const usedKeys = new Set(selectedEntries.map((e) => connectionKeyOf(e)).filter((k): k is string => !!k));
    const referenceMappings = Object.fromEntries(Object.entries(mappings).filter(([k]) => usedKeys.has(k)));

    try {
      const res = await configurationApi.importConfiguration(
        {
          document,
          mode,
          selection: selectedEntries.map((e) => ({ type: e.type, key: e.key as string })),
          options: {
            referenceMappings: Object.keys(referenceMappings).length ? referenceMappings : undefined,
            restoreLandingZone: hasLandingZone && restoreLandingZone,
            atomic,
            ignoreIntegrityMismatch: ignoreIntegrity,
          },
        },
        attemptKey.current,
      );
      setResult(res);
      setStep(5);
      onImported();
    } catch (e) {
      setImportError(errMessage(e, 'Import failed.'));
    } finally {
      setImporting(false);
    }
  }, [document, selectedEntries, mappings, mode, hasLandingZone, restoreLandingZone, atomic, ignoreIntegrity, connectionKeyOf, onImported]);

  return {
    step,
    setStep,
    fileName,
    preview,
    fileIssues,
    checking,
    loadFile,
    reset,
    entries,
    stats,
    isValid,
    openErrors,
    mappedConnectionLabel,
    isSelected,
    selectedEntries,
    toggleEntry,
    selectAllValid,
    connectionKeyOf,
    savedQueryOf,
    mappings,
    setMapping,
    existingConnections,
    unresolvedCount: unresolvedQueries.length,
    mode,
    setMode,
    restoreLandingZone,
    atomic,
    ignoreIntegrity,
    setOption,
    hasLandingZone,
    plan,
    planCounts,
    needCredentials,
    canAdvance,
    importing,
    importError,
    execute,
    result,
  };
}

export type ImportWizardState = ReturnType<typeof useImportWizard>;
