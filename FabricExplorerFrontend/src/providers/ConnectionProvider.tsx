'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as connectionsApi from '@/lib/api/connections.api';
import type { Connection } from '@/types/connection';
import { useToast } from './ToastProvider';

interface ConnectionContextValue {
  activeConnection: Connection | null;
  refreshActive: () => Promise<Connection | null | undefined>;
  setActiveConnection: (connection: Connection | null) => void;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const { showApiError } = useToast();
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const inflight = useRef<Promise<Connection | null | undefined> | null>(null);

  const refreshActive = useCallback(() => {
    if (!inflight.current) {
      inflight.current = connectionsApi
        .getActive()
        .then((conn) => {
          setActiveConnection(conn);
          return conn;
        })
        .catch((err) => {
          showApiError(err, 'Could not load active connection');
          return undefined;
        })
        .finally(() => {
          inflight.current = null;
        });
    }
    return inflight.current;
  }, [showApiError]);

  useEffect(() => {
    void refreshActive();
  }, [refreshActive]);

  const value = useMemo(
    () => ({ activeConnection, refreshActive, setActiveConnection }),
    [activeConnection, refreshActive],
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used inside <ConnectionProvider>');
  return ctx;
}
