import type { Metadata } from 'next';
import { LandingZoneView } from '@/features/landing-zone/LandingZoneView';

export const metadata: Metadata = { title: 'Landing Zone Explorer' };

export default function Page() {
  return <LandingZoneView />;
}
