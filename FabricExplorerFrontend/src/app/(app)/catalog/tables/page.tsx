import type { Metadata } from 'next';
import { TableView } from '@/features/catalog/table/TableView';

export const metadata: Metadata = { title: 'Table' };

export default function Page() {
  return <TableView />;
}
