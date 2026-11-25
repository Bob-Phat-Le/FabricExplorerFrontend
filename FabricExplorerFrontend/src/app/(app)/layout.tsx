import { AppShell } from '@/components/layout/AppShell';
import { LandingZoneProvider } from '@/providers/LandingZoneProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingZoneProvider>
      <AppShell>{children}</AppShell>
    </LandingZoneProvider>
  );
}
