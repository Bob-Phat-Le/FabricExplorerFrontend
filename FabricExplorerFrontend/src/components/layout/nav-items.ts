export interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/connection', label: 'Connection', icon: 'fa-plug' },
  { href: '/discovery', label: 'Discovery', icon: 'fa-compass' },
  { href: '/ingestion', label: 'Ingestion', icon: 'fa-circle-arrow-down' },
  { href: '/replication', label: 'Replication', icon: 'fa-arrows-rotate' },
  { href: '/job-instances', label: 'Job Instances', icon: 'fa-clock-rotate-left' },
  { href: '/settings', label: 'Settings', icon: 'fa-gear' },
];
