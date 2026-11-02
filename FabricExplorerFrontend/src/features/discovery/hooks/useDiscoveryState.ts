import type { ResourceType } from '../constants';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'fabric-explorer:discovery-state';

export interface DiscoveryState {
  current: ResourceType;
  lakehouseId: string | null;
  warehouseId: string | null;
  mirroredDatabaseId: string | null;
}

const DEFAULT_STATE: DiscoveryState = {
  current: 'lakehouse',
  lakehouseId: null,
  warehouseId: null,
  mirroredDatabaseId: null,
};

function readState(): DiscoveryState {
  if (typeof window === 'undefined') {
    return DEFAULT_STATE;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<DiscoveryState>;

    const current =
      parsed.current === 'lakehouse' ||
      parsed.current === 'warehouse' ||
      parsed.current === 'mirrored'
        ? parsed.current
        : DEFAULT_STATE.current;

    return {
      current,
      lakehouseId:
        typeof parsed.lakehouseId === 'string'
          ? parsed.lakehouseId
          : null,
      warehouseId:
        typeof parsed.warehouseId === 'string'
          ? parsed.warehouseId
          : null,
      mirroredDatabaseId:
        typeof parsed.mirroredDatabaseId === 'string'
          ? parsed.mirroredDatabaseId
          : null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

let cache: DiscoveryState | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): DiscoveryState {
  if (cache === null) cache = readState();
  return cache;
}

function getServerSnapshot(): DiscoveryState {
  return DEFAULT_STATE;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function updateState(patch: Partial<DiscoveryState>) {
  const prev = getSnapshot();
  const changed = (Object.keys(patch) as (keyof DiscoveryState)[]).some(
    (k) => patch[k] !== prev[k],
  );
  if (!changed) return; // tránh re-render thừa

  const next = { ...prev, ...patch };
  cache = next;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore sessionStorage errors.
  }

  listeners.forEach((l) => l());
}

// Setter ở module-level => identity ổn định, dùng làm deps an toàn
const setCurrent = (current: ResourceType) => updateState({ current });
const setLakehouseId = (lakehouseId: string | null) => updateState({ lakehouseId });
const setWarehouseId = (warehouseId: string | null) => updateState({ warehouseId });
const setMirroredDatabaseId = (mirroredDatabaseId: string | null) =>
  updateState({ mirroredDatabaseId });

export function useDiscoveryState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    current: state.current,
    lakehouseId: state.lakehouseId,
    warehouseId: state.warehouseId,
    mirroredDatabaseId: state.mirroredDatabaseId,
    setCurrent,
    setLakehouseId,
    setWarehouseId,
    setMirroredDatabaseId,
  };
}