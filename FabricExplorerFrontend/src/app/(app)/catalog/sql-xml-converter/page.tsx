import type { Metadata } from 'next';
import { ConverterView } from '@/features/catalog/sql_xml_converter/ConverterView';

export const metadata: Metadata = { title: 'Converter' };

export default function Page() {
  return <ConverterView />;
}
