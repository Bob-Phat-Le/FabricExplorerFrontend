'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useLandingZone, type LandingZoneState } from '@/features/landing-zone/hooks/useLandingZone';

const LandingZoneContext = createContext<LandingZoneState | null>(null);

/**
 * Keeps the Landing Zone Explorer state (config, folder tree, current folder, selection, history…) alive while the
 * user moves between pages, so coming back does not reload everything. Mounted once in the (app) layout.
 */
export function LandingZoneProvider({ children }: { children: ReactNode }) {
  const state = useLandingZone();
  return <LandingZoneContext.Provider value={state}>{children}</LandingZoneContext.Provider>;
}

export function useLandingZoneContext(): LandingZoneState {
  const ctx = useContext(LandingZoneContext);
  if (!ctx) throw new Error('useLandingZoneContext must be used within LandingZoneProvider');
  return ctx;
}
