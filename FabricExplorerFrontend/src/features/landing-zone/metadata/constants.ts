import type { StepDef } from '@/components/ui/Stepper';
import type { MetadataFormatInfo } from '@/types/landingZone';

export const STEP = { source: 1, types: 2, configure: 3, preview: 4, publish: 5 } as const;
export type StepId = (typeof STEP)[keyof typeof STEP];

export interface MetadataStepDef extends StepDef {
  id: StepId;
  nextLabel: string;
  /** steps that do not apply to the selected format are skipped (e.g. data types for a self-describing format) */
  appliesTo: (format: MetadataFormatInfo) => boolean;
}

const always = () => true;

export const METADATA_STEPS: MetadataStepDef[] = [
  { id: STEP.source, title: 'Format & XSD', subtitle: 'Choose format, scan schema', nextLabel: 'Next: Review Data Types', appliesTo: always },
  { id: STEP.types, title: 'Data Types', subtitle: 'Map XSD to Fabric', nextLabel: 'Next: Configure', appliesTo: (f) => f.requiresColumnTypes },
  { id: STEP.configure, title: 'Configure', subtitle: 'Table & key columns', nextLabel: 'Next: Preview', appliesTo: always },
  { id: STEP.preview, title: 'Preview', subtitle: 'Validate metadata', nextLabel: 'Next: Upload', appliesTo: always },
  { id: STEP.publish, title: 'Upload', subtitle: 'Write to Landing Zone', nextLabel: 'Upload', appliesTo: always },
];

export const PREVIEW_DEBOUNCE_MS = 300;
export const DEFAULT_SCHEMA_NAME = 'dbo';
export const ALREADY_EXISTS_ERROR_CODE = 'metadata_generate.metadata_already_exists';
