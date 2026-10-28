'use client';

import type { ReactNode } from 'react';
import { ToastProvider } from './ToastProvider';
import { ConnectionProvider } from './ConnectionProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConnectionProvider>{children}</ConnectionProvider>
    </ToastProvider>
  );
}
