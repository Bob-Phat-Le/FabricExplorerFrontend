import type { ConfigurationCapabilities } from '@/types/configuration';

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;
export const SEARCH_DEBOUNCE_MS = 300;

/** Used until `/configuration/capabilities` answers (or if it fails). */
export const FALLBACK_CAPABILITIES: ConfigurationCapabilities = {
  format: 'fabric-explorer.configuration',
  supportedFormatVersions: [1],
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxEntriesPerType: 1000,
  types: [
    { type: 'Connection', collection: 'connections' },
    { type: 'SavedQuery', collection: 'savedQueries' },
  ],
  importModes: ['merge', 'overwrite'],
};

export const TYPE_FILTERS = [
  { value: '', label: 'Type: All configurations' },
  { value: 'Connection', label: 'Connections only' },
  { value: 'SavedQuery', label: 'Saved queries only' },
] as const;

export const STATUS_FILTERS = [
  { value: '', label: 'Status: All' },
  { value: 'Configured', label: 'Credentials OK' },
  { value: 'Missing', label: 'Needs credentials' },
  { value: 'Resolved', label: 'Query: connection resolved' },
  { value: 'Unresolved', label: 'Query: connection missing' },
] as const;
