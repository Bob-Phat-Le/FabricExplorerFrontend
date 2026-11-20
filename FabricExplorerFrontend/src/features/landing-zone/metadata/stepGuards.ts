import { STEP, type StepId } from './constants';

export interface GuardContext {
  hasAnalysis: boolean;
  unresolvedCount: number;
  targetError: string | null;
  previewing: boolean;
  canPublish: boolean;
}

export interface GuardFailure {
  message: string;
  /** step the user is sent back to; stays on the current step when omitted */
  redirectTo?: StepId;
}

export type StepGuard = (ctx: GuardContext) => GuardFailure | null;

const requireAnalysis: StepGuard = (ctx) =>
  ctx.hasAnalysis ? null : { message: 'Upload and scan an XSD file first', redirectTo: STEP.source };

const requireResolvedTypes: StepGuard = (ctx) =>
  ctx.unresolvedCount === 0 ? null : { message: `Select a Fabric data type for ${ctx.unresolvedCount} included field(s) first`, redirectTo: STEP.types };

const requireValidTarget: StepGuard = (ctx) => (ctx.targetError ? { message: ctx.targetError, redirectTo: STEP.configure } : null);

const requirePublishable: StepGuard = (ctx) =>
  ctx.canPublish ? null : { message: ctx.previewing ? 'The preview is still being generated' : 'Fix the validation errors before uploading' };

/** Conditions to enter a step; each step also requires everything the previous steps required. */
export const ENTRY_GUARDS: Record<StepId, StepGuard[]> = {
  [STEP.source]: [],
  [STEP.types]: [requireAnalysis],
  [STEP.configure]: [requireAnalysis, requireResolvedTypes],
  [STEP.preview]: [requireAnalysis, requireResolvedTypes, requireValidTarget],
  [STEP.publish]: [requireAnalysis, requireResolvedTypes, requireValidTarget, requirePublishable],
};
