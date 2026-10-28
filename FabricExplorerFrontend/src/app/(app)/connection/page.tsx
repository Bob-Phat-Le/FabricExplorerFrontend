import type { Metadata } from 'next';
import { ConnectionView } from '@/features/connection/ConnectionView';

export const metadata: Metadata = { title: 'Connection' };

export default function Page() {
  return <ConnectionView />;
}
