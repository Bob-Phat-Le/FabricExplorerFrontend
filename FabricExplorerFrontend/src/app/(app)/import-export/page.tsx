import type { Metadata } from 'next';
import { ImportExportView } from '@/features/import-export/ImportExportView';

export const metadata: Metadata = { title: 'Import & Export' };

export default function Page() {
  return <ImportExportView />;
}
