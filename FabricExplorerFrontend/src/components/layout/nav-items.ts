export interface NavItemGroup {
  groupLabel: string;
  icon: string;
  group: NavItem[]
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: (NavItem | NavItemGroup)[] = [
  { href: '/connection', label: 'Connection', icon: 'fa-plug' },
  { href: '/discovery', label: 'Discovery', icon: 'fa-compass' },

  {
    groupLabel: 'Catalog',
    icon: 'fa-book-bookmark',
    group: [
      { href: '/catalog/tables', label: 'Tables', icon: 'fa-table'},
      { href: '/catalog/query-editor', label: 'Query Editor', icon: 'fa-terminal'},
      { href: '/catalog/sql-xml-converter', label: 'SQL XML Converter', icon: 'fa-code'}
    ]
  },

  { href: '/ingestion', label: 'Ingestion', icon: 'fa-circle-arrow-down' },
  { href: '/replication', label: 'Replication', icon: 'fa-arrows-rotate' },
  { href: '/job-instances', label: 'Job Instances', icon: 'fa-clock-rotate-left' },
  { href: '/settings', label: 'Settings', icon: 'fa-gear' },
];
