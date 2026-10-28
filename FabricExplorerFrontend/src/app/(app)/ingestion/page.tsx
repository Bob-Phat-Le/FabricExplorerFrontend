import type { Metadata } from 'next';
import { IngestionView } from '@/features/ingestion/IngestionView';

export const metadata: Metadata = { title: 'Ingestion Wizard' };

export default function Page() {
  return <IngestionView />;
}
