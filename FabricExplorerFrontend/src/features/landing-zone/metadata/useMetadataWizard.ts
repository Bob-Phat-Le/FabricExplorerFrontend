import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as lzApi from '@/lib/api/landingZone.api';
import { ApiError } from '@/lib/api/client';
import { useClipboard } from '@/hooks/useClipboard';
import { useToast } from '@/providers/ToastProvider';
import type {
  FormatOption,
  LandingZoneItem,
  MetadataCapabilities,
  MetadataPreview,
  MetadataRequest,
  PublishMetadataResult,
  XsdAnalysis,
  XsdRecord,
} from '@/types/landingZone';
import type { LandingZoneState } from '../hooks/useLandingZone';
import { joinPath, saveBlob, validateName } from '../utils';
import { ALREADY_EXISTS_ERROR_CODE, DEFAULT_SCHEMA_NAME, METADATA_STEPS, PREVIEW_DEBOUNCE_MS, STEP, type StepId } from './constants';
import { SAMPLE_XSD, SAMPLE_XSD_NAME } from './sampleXsd';
import { ENTRY_GUARDS } from './stepGuards';

export interface WizardColumn {
  id: string;
  name: string;
  xsdType: string;
  recommendedType: string;
  fabricType: string;
  nullable: boolean;
  included: boolean;
  isAttribute: boolean;
  isNested: boolean;
  isRepeating: boolean;
}

export type BaseFolder = 'root' | 'current';
export type ExistingState = 'unknown' | 'checking' | 'yes' | 'no';

const defaultsOf = (options: FormatOption[]) => Object.fromEntries(options.map((o) => [o.key, o.defaultValue]));

const toColumns = (record: XsdRecord): WizardColumn[] =>
  record.fields.map((f, i) => ({
    id: `${i}:${f.name}`,
    name: f.name,
    xsdType: f.xsdType,
    recommendedType: f.recommendedFabricType,
    fabricType: f.recommendedFabricType,
    nullable: f.nullable,
    included: f.recommendedFabricType !== '',
    isAttribute: f.isAttribute,
    isNested: f.isNested,
    isRepeating: f.isRepeating,
  }));

/** The backend marks key candidates; fall back to any plain "...id" field. */
const defaultKeys = (record: XsdRecord) => {
  const key =
    record.fields.find((f) => f.isKeyCandidate) ??
    record.fields.find((f) => /id$/i.test(f.name) && f.recommendedFabricType !== '' && !f.isNested && !f.isRepeating);
  return key ? [key.name] : [];
};

/** State and actions of the "Generate Metadata" wizard. Formats, options and data types come from the backend. */
export function useMetadataWizard(lz: LandingZoneState, capabilities: MetadataCapabilities) {
  const { showToast, showApiError } = useToast();
  const copy = useClipboard();
  const connectionId = lz.connectionId;
  const { fabricTypes, metadataFileName, schemaFolderSuffix } = capabilities;

  const [step, setStep] = useState<StepId>(STEP.source);

  // ---- source: format + XSD ----
  const [formatName, setFormatName] = useState(capabilities.formats[0].name);
  const [options, setOptions] = useState<Record<string, string>>(() => defaultsOf(capabilities.formats[0].options));
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<XsdAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzeSeq = useRef(0);

  // ---- columns, keys, target ----
  const [recordName, setRecordName] = useState('');
  const [columns, setColumns] = useState<WizardColumn[]>([]);
  const [keyColumns, setKeyColumns] = useState<string[]>([]);
  const [schemaName, setSchemaName] = useState(DEFAULT_SCHEMA_NAME);
  const [tableName, setTableName] = useState('');
  const [baseFolder, setBaseFolder] = useState<BaseFolder>('root');
  const openedIn = useRef(lz.currentPath);

  // ---- generated JSON ----
  const [preview, setPreview] = useState<MetadataPreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewSeq = useRef(0);

  // ---- upload ----
  const [existing, setExisting] = useState<ExistingState>('unknown');
  const [existingText, setExistingText] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<PublishMetadataResult | null>(null);

  const format = capabilities.formats.find((f) => f.name === formatName) ?? capabilities.formats[0];
  const typed = format.requiresColumnTypes;

  const parentPath = baseFolder === 'current' ? openedIn.current : '';
  const cleanSchema = schemaName.trim().toLowerCase().endsWith(schemaFolderSuffix.toLowerCase())
    ? schemaName.trim().slice(0, -schemaFolderSuffix.length)
    : schemaName.trim();
  const tableFolder = joinPath(parentPath, cleanSchema + schemaFolderSuffix, tableName.trim());
  const filePath = joinPath(tableFolder, metadataFileName);

  const unresolved = useMemo(() => (typed ? columns.filter((c) => c.included && !fabricTypes.includes(c.fabricType)) : []), [typed, columns, fabricTypes]);

  const targetError = useMemo(() => {
    const problem = validateName(cleanSchema) ? `Schema name: ${validateName(cleanSchema)}` : validateName(tableName) ? `Table name: ${validateName(tableName)}` : null;
    return problem;
  }, [cleanSchema, tableName]);

  /** Columns that may be a key: the included columns of a typed format, any plain field otherwise. */
  const keyCandidates = useMemo(() => columns.filter((c) => (typed ? c.included : !c.isNested && !c.isRepeating)), [columns, typed]);

  const request = useMemo<MetadataRequest>(
    () => ({
      fileFormat: format.name,
      keyColumns,
      columns: columns.map((c) => ({ name: c.name, fabricType: c.fabricType, included: c.included, nullable: c.nullable })),
      options,
    }),
    [format.name, keyColumns, columns, options],
  );

  const canPublish = !!preview?.isValid && !previewing && !previewError && !targetError;

  // ---------------------------------------------------------------------
  // source
  // ---------------------------------------------------------------------

  const setFormat = useCallback(
    (name: string) => {
      const next = capabilities.formats.find((f) => f.name === name);
      if (!next || next.name === formatName) return;
      setFormatName(next.name);
      setOptions(defaultsOf(next.options));
    },
    [capabilities, formatName],
  );

  const setOption = useCallback((key: string, value: string) => setOptions((prev) => ({ ...prev, [key]: value })), []);

  const applyRecord = useCallback((result: XsdAnalysis, name: string) => {
    const record = result.records.find((r) => r.name === name) ?? result.records[0];
    if (!record) return;
    setRecordName(record.name);
    setColumns(toColumns(record));
    setKeyColumns(defaultKeys(record));
    setTableName(record.name);
    setPreview(null);
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setColumns([]);
    setKeyColumns([]);
    setRecordName('');
    setPreview(null);
  }, []);

  const analyze = useCallback(
    async (xsd: File) => {
      const seq = ++analyzeSeq.current;
      setAnalyzing(true);
      setAnalyzeError(null);
      setFile(xsd);
      try {
        const result = await lzApi.analyzeXsd(xsd);
        if (seq !== analyzeSeq.current) return;
        setAnalysis(result);
        applyRecord(result, result.records[0]?.name ?? '');
      } catch (err) {
        if (seq !== analyzeSeq.current) return;
        clearAnalysis();
        setAnalyzeError(err instanceof Error ? err.message : 'Could not read the XSD file.');
      } finally {
        if (seq === analyzeSeq.current) setAnalyzing(false);
      }
    },
    [applyRecord, clearAnalysis],
  );

  const loadSample = useCallback(() => analyze(new File([SAMPLE_XSD], SAMPLE_XSD_NAME, { type: 'application/xml' })), [analyze]);

  const rescan = useCallback(() => {
    const dirty = columns.some((c) => c.fabricType !== c.recommendedType || c.included !== (c.recommendedType !== ''));
    if (!file || (dirty && !window.confirm('Re-scanning discards your data type changes. Continue?'))) return;
    void analyze(file);
  }, [file, columns, analyze]);

  const removeFile = useCallback(() => {
    analyzeSeq.current++;
    setFile(null);
    setAnalyzing(false);
    setAnalyzeError(null);
    clearAnalysis();
  }, [clearAnalysis]);

  const selectRecord = useCallback((name: string) => analysis && applyRecord(analysis, name), [analysis, applyRecord]);

  // ---------------------------------------------------------------------
  // columns and keys
  // ---------------------------------------------------------------------

  const toggleInclude = useCallback(
    (id: string, included: boolean) => {
      const column = columns.find((c) => c.id === id);
      setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, included } : c)));
      if (!included && column) setKeyColumns((prev) => prev.filter((k) => k !== column.name));
    },
    [columns],
  );

  const toggleIncludeAll = useCallback((included: boolean) => {
    setColumns((prev) => prev.map((c) => ({ ...c, included })));
    if (!included) setKeyColumns([]);
  }, []);

  /** Choosing a type for an excluded field includes it. */
  const setFabricType = useCallback((id: string, fabricType: string) => {
    setColumns((prev) => prev.map((c) => (c.id === id ? { ...c, fabricType, included: c.included || fabricType !== '' } : c)));
  }, []);

  const resetTypes = useCallback(() => {
    setColumns((prev) => prev.map((c) => ({ ...c, fabricType: c.recommendedType })));
    showToast('Reset all data types to the recommended ones', 'info');
  }, [showToast]);

  const toggleKey = useCallback((name: string, checked: boolean) => {
    setKeyColumns((prev) => (checked ? [...new Set([...prev, name])] : prev.filter((k) => k !== name)));
  }, []);

  // ---------------------------------------------------------------------
  // live preview: the backend renders and validates the JSON
  // ---------------------------------------------------------------------

  useEffect(() => {
    if (step < STEP.configure || !analysis) return;

    const seq = ++previewSeq.current;
    const isCurrent = () => seq === previewSeq.current;
    setPreviewing(true);

    const timer = setTimeout(() => {
      lzApi
        .previewMetadata(request)
        .then((result) => isCurrent() && (setPreview(result), setPreviewError(null)))
        .catch((err) => isCurrent() && (setPreview(null), setPreviewError(err instanceof Error ? err.message : 'Could not generate the preview.')))
        .finally(() => isCurrent() && setPreviewing(false));
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [step, analysis, request]);

  // ---------------------------------------------------------------------
  // upload target
  // ---------------------------------------------------------------------

  useEffect(() => {
    setExisting('unknown');
    setExistingText(null);
  }, [filePath]);

  useEffect(() => {
    if (step !== STEP.publish || !connectionId) return;

    let active = true;
    setExisting('checking');
    lzApi
      .getFileDetails(connectionId, filePath)
      .then(() => active && setExisting('yes'))
      .catch((err) => active && setExisting(err instanceof ApiError && err.status === 404 ? 'no' : 'unknown'));
    return () => {
      active = false;
    };
  }, [step, connectionId, filePath]);

  // ---------------------------------------------------------------------
  // navigation
  // ---------------------------------------------------------------------

  const goTo = useCallback(
    (target: StepId) => {
      const applicable = METADATA_STEPS.filter((s) => s.appliesTo(format));
      const next =
        target > step
          ? (applicable.find((s) => s.id >= target) ?? applicable[applicable.length - 1])
          : ([...applicable].reverse().find((s) => s.id <= target) ?? applicable[0]);
      if (next.id === step) return;

      if (next.id > step) {
        const context = { hasAnalysis: !!analysis, unresolvedCount: unresolved.length, targetError, previewing, canPublish };
        const failure = ENTRY_GUARDS[next.id].map((guard) => guard(context)).find((result) => result !== null);
        if (failure) {
          showToast(failure.message, 'warning');
          if (failure.redirectTo && failure.redirectTo !== step) setStep(failure.redirectTo);
          return;
        }
      }
      setStep(next.id);
    },
    [step, format, analysis, unresolved.length, targetError, previewing, canPublish, showToast],
  );

  const next = useCallback(() => goTo((step + 1) as StepId), [goTo, step]);
  const back = useCallback(() => goTo((step - 1) as StepId), [goTo, step]);

  // ---------------------------------------------------------------------
  // preview / upload actions
  // ---------------------------------------------------------------------

  const copyJson = useCallback(() => {
    if (preview?.json) void copy(preview.json, `${metadataFileName} copied to clipboard`);
  }, [copy, preview, metadataFileName]);

  const downloadJson = useCallback(() => {
    if (!preview?.json) return;
    saveBlob(new Blob([preview.json], { type: 'application/json' }), metadataFileName);
    showToast(`Downloaded ${metadataFileName}`, 'success');
  }, [preview, metadataFileName, showToast]);

  const inspectExisting = useCallback(async () => {
    if (!connectionId) return;
    try {
      const result = await lzApi.getPreview(connectionId, filePath);
      setExistingText(result.text ?? '(this file cannot be previewed)');
    } catch (err) {
      showApiError(err, `Could not read the existing ${metadataFileName}`);
    }
  }, [connectionId, filePath, metadataFileName, showApiError]);

  const publish = useCallback(
    async (overwrite: boolean) => {
      if (!connectionId || !canPublish) return;
      setPublishing(true);
      try {
        const result = await lzApi.publishMetadata(connectionId, { parentPath, schemaName: cleanSchema, tableName: tableName.trim(), overwrite, metadata: request });
        setPublished(result);
        showToast(`${result.overwritten ? 'Replaced' : 'Uploaded'} ${metadataFileName} in the Landing Zone`, 'success');
      } catch (err) {
        if (err instanceof ApiError && err.code === ALREADY_EXISTS_ERROR_CODE) {
          setExisting('yes');
          showToast(`${metadataFileName} already exists in the target folder. Confirm to replace it.`, 'warning');
        } else {
          showApiError(err, `Could not upload ${metadataFileName}`);
        }
      } finally {
        setPublishing(false);
        void lz.refresh(true);
      }
    },
    [connectionId, canPublish, parentPath, cleanSchema, tableName, request, metadataFileName, lz, showToast, showApiError],
  );

  const reset = useCallback(() => {
    analyzeSeq.current++;
    previewSeq.current++;
    setStep(STEP.source);
    setFormatName(capabilities.formats[0].name);
    setOptions(defaultsOf(capabilities.formats[0].options));
    setFile(null);
    setAnalyzing(false);
    setAnalyzeError(null);
    clearAnalysis();
    setSchemaName(DEFAULT_SCHEMA_NAME);
    setTableName('');
    setBaseFolder('root');
    setPreviewError(null);
    setPreviewing(false);
    setPublished(null);
  }, [capabilities, clearAnalysis]);

  /** The uploaded file as an explorer item (opens it in the file drawer). */
  const publishedItem = useMemo<LandingZoneItem | null>(
    () =>
      published && {
        name: metadataFileName,
        path: published.filePath,
        isFolder: false,
        extension: metadataFileName.split('.').pop() ?? null,
        sizeBytes: preview?.json.length ?? null,
        lastModified: new Date().toISOString(),
        owner: null,
      },
    [published, preview, metadataFileName],
  );

  return {
    capabilities,
    fileName: metadataFileName,
    step,
    goTo,
    next,
    back,

    format,
    setFormat,
    typed,
    options,
    setOption,

    file,
    analysis,
    analyzing,
    analyzeError,
    analyze,
    loadSample,
    rescan,
    removeFile,
    recordName,
    selectRecord,

    columns,
    unresolved,
    toggleInclude,
    toggleIncludeAll,
    setFabricType,
    resetTypes,

    keyColumns,
    keyCandidates,
    toggleKey,

    schemaName,
    setSchemaName,
    tableName,
    setTableName,
    baseFolder,
    setBaseFolder,
    openedIn: openedIn.current,
    tableFolder,
    filePath,
    targetError,

    preview,
    previewing,
    previewError,
    copyJson,
    downloadJson,

    existing,
    existingText,
    inspectExisting,
    canPublish,
    publishing,
    publish,
    published,
    publishedItem,
    reset,
  };
}

export type MetadataWizardState = ReturnType<typeof useMetadataWizard>;
