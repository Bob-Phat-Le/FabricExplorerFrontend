'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from './ToastProvider';
import { ConnectionProvider } from './ConnectionProvider';
import { NotificationProvider } from './NotificationProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConnectionProvider>
        <NotificationProvider>{children}</NotificationProvider>
      </ConnectionProvider>
    </ToastProvider>
  );
}
