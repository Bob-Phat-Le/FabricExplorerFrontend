import type { Metadata } from 'next';
import { JobInstancesView } from '@/features/job-instances/JobInstancesView';

export const metadata: Metadata = { title: 'Job Instances' };

export default function Page() {
  return <JobInstancesView />;
}
