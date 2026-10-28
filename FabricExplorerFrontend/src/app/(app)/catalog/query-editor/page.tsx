import type { Metadata } from 'next';
import { EditorView } from '@/features/catalog/query_editor/EditorView';

export const metadata: Metadata = { title: 'Table' };

export default function Page() {
  return <EditorView />;
}
