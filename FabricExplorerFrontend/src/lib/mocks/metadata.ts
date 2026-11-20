import { ApiError, type RequestOptions } from '../api/client';
import type { FormatOption, MetadataCapabilities, MetadataPreview, MetadataRequest, XsdAnalysis, XsdRecordField } from '@/types/landingZone';

/** Mock of the "Generate Metadata" endpoints (NEXT_PUBLIC_USE_MOCK=true). Mirrors the backend rules. */

/** Mirror of what GET /landing-zone/metadata/capabilities returns. */
const flag = (key: string): FormatOption => ({ key, label: key, kind: 'Flag', defaultValue: 'true', required: true, readOnly: true, hint: null, choices: null, pattern: null });
const text = (key: string, defaultValue: string, extra: Partial<FormatOption> = {}): FormatOption => ({
  key, label: key, kind: 'Text', defaultValue, required: false, readOnly: false, hint: null, choices: null, pattern: null, ...extra,
});
const delimitedOptions = (columnSeparator: string, ...leading: FormatOption[]): FormatOption[] => [
  ...leading,
  flag('FirstRowAsHeader'),
  text('ColumnSeparator', columnSeparator, { kind: 'EscapedText', required: true, hint: 'Type \\t for a tab.' }),
  text('RowSeparator', '\\r\\n', { kind: 'EscapedText', required: true, hint: 'Type \\r\\n or \\n.' }),
  text('QuoteCharacter', '"'),
  text('EscapeCharacter', '\\'),
  text('Encoding', 'UTF-8', { kind: 'Choice', required: true, choices: ['UTF-8', 'UTF-16'] }),
  text('NullValue', '', { label: 'NullValue (optional)', hint: 'For example NULL.' }),
];

export const MOCK_CAPABILITIES: MetadataCapabilities = {
  fabricTypes: ['Double', 'Single', 'Int16', 'Int32', 'Int64', 'DateTime', 'IDate', 'ITime', 'String', 'Boolean', 'ByteArray'],
  metadataFileName: '_metadata.json',
  schemaFolderSuffix: '.schema',
  formats: [
    { name: 'CSV', title: 'CSV (Comma Separated)', description: 'Requires explicit Fabric data types in SchemaDefinition.', requiresColumnTypes: true, options: delimitedOptions(',') },
    {
      name: 'DelimitedText',
      title: 'DelimitedText (TSV / Custom)',
      description: 'Custom file extension and delimiters, with explicit Fabric data types.',
      requiresColumnTypes: true,
      options: delimitedOptions('\\t', text('FileExtension', 'tsv', { required: true, hint: 'Letters and digits only, without the dot.', pattern: '^[A-Za-z0-9]{1,16}$' })),
    },
    { name: 'Parquet', title: 'Parquet', description: 'Self-describing: no delimiter options and no data type mapping are needed.', requiresColumnTypes: false, options: [] },
  ],
};

const field = (
  name: string,
  xsdType: string,
  recommendedFabricType: string,
  nullable: boolean,
  extra: Partial<XsdRecordField> = {},
): XsdRecordField => ({
  name,
  xsdType,
  recommendedFabricType,
  nullable,
  isKeyCandidate: false,
  isAttribute: false,
  isNested: false,
  isRepeating: false,
  ...extra,
});

const sampleAnalysis: XsdAnalysis = {
  targetNamespace: 'http://schemas.company.com/crm/customer',
  complexTypeCount: 2,
  simpleTypeCount: 4,
  records: [
    {
      name: 'Customer',
      fields: [
        field('CreatedAt', 'xs:dateTime', 'DateTime', false),
        field('CustomerId', 'xs:int', 'Int32', false, { isKeyCandidate: true }),
        field('CustomerName', 'xs:string', 'String', true),
        field('Email', 'EmailAddressType', 'String', true),
        field('BirthDate', 'xs:date', 'IDate', true),
        field('PreferredContactTime', 'xs:time', 'ITime', true),
        field('LoyaltyScore', 'BoundedScoreType', 'Int32', false),
        field('Balance', 'CurrencyAmountType', 'Double', true),
        field('IsActive', 'xs:boolean', 'Boolean', false),
        field('AccountTier', 'AccountTierType', 'String', true),
        field('ProfileAvatar', 'xs:base64Binary', 'ByteArray', true),
        field('Address', 'complexType', '', true, { isNested: true }),
        field('ContractLength', 'xs:duration', '', true),
        field('TenantCode', 'xs:normalizedString (@attribute)', 'String', false, { isAttribute: true, isKeyCandidate: false }),
      ],
    },
    {
      name: 'AuditBatchHeader',
      fields: [field('BatchId', 'xs:long', 'Int64', false, { isKeyCandidate: true }), field('GeneratedAt', 'xs:dateTime', 'DateTime', false)],
    },
  ],
};

export async function analyzeXsd(file: File): Promise<XsdAnalysis> {
  const text = await file.text();
  if (!file.size || !/<(\w+:)?schema[\s>]/.test(text)) {
    throw new ApiError('The file is not a valid XSD.', { status: 400, code: 'metadata_generate.invalid_xsd' });
  }
  return sampleAnalysis;
}

const ESCAPES: Record<string, string> = { t: '\t', r: '\r', n: '\n', '\\': '\\' };

/** Same rules as the backend generator, driven by the capability descriptors. */
export function buildMetadata(request: MetadataRequest, caps: MetadataCapabilities = MOCK_CAPABILITIES): MetadataPreview {
  const fileName = caps.metadataFileName;
  const format = caps.formats.find((f) => f.name.toLowerCase() === request.fileFormat.toLowerCase());
  if (!format) return { fileName, json: '', isValid: false, errors: [`Unsupported file format '${request.fileFormat}'.`] };

  const errors: string[] = [];
  const valueOf = (o: FormatOption) => request.options[o.key] ?? o.defaultValue;

  format.options.forEach((o) => {
    const value = valueOf(o);
    if (!value) o.required && errors.push(`${o.key} is required.`);
    else if (o.choices && !o.choices.includes(value)) errors.push(`${o.key} must be one of: ${o.choices.join(', ')}.`);
    else if (o.pattern && !new RegExp(o.pattern).test(value)) errors.push(`${o.key} is invalid. ${o.hint ?? ''}`.trim());
  });

  const keys = request.keyColumns.map((k) => k.trim());
  const included = request.columns.filter((c) => c.included);

  if (format.requiresColumnTypes) {
    if (!included.length) errors.push('At least one column must be included.');
    included.filter((c) => !caps.fabricTypes.includes(c.fabricType)).forEach((c) => errors.push(`Column '${c.name}' needs a supported Fabric data type.`));
    keys.filter((k) => !included.some((c) => c.name.trim() === k)).forEach((k) => errors.push(`Key column '${k}' is excluded or missing from the schema.`));
  }
  if (errors.length) return { fileName, json: '', isValid: false, errors };

  const metadata: Record<string, unknown> = {};
  if (keys.length) metadata.keyColumns = keys;
  metadata.FileFormat = format.name;
  format.options.forEach((o) => {
    const value = valueOf(o);
    if (!value) return;
    metadata[o.key] = o.kind === 'Flag' ? value === 'true' : o.kind === 'EscapedText' ? value.replace(/\\([trn\\])/g, (_, c: string) => ESCAPES[c]) : value;
  });
  if (format.requiresColumnTypes) {
    metadata.SchemaDefinition = { Columns: included.map((c) => ({ Name: c.name.trim(), DataType: c.fabricType, IsNullable: c.nullable })) };
  }

  return { fileName, json: JSON.stringify(metadata, null, 2), isValid: true, errors: [] };
}

export const getMetadataCapabilities = (): MetadataCapabilities => MOCK_CAPABILITIES;
export const previewMetadata = (req: RequestOptions): MetadataPreview => buildMetadata(req.body as MetadataRequest);
