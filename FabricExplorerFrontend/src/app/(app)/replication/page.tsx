import type { Metadata } from 'next';
import { ReplicationView } from '@/features/replication/ReplicationView';

export const metadata: Metadata = { title: 'Replication Wizard' };

export default function Page() {
  return <ReplicationView />;
}
