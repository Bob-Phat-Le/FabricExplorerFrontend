export type FabricItemType = 'Lakehouse' | 'Warehouse' | 'MirroredDatabase';

export interface FabricItem {
  id: string;
  name: string;
  type: FabricItemType | string;
  workspace: string;
}

export interface CreateItemPayload {
  displayName: string;
  type: FabricItemType;
}

export type JobStatus = 'Completed' | 'InProgress' | 'Failed' | 'Cancelled' | 'Deduped' | 'NotStarted' | string;

export interface JobInstance {
  id: string;
  jobType: string;
  invokeType: string;
  status: JobStatus;
  startTime: string;
  endTime: string | null;
  rootActivityId: string;
  errorMsg?: string;
}

export interface JobsPage {
  items: JobInstance[];
  continuationToken: string | null;
}
