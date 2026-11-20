import { useEffect, useState } from 'react';
import * as lzApi from '@/lib/api/landingZone.api';
import type { MetadataCapabilities } from '@/types/landingZone';

/** Loads what the backend supports (formats, options, Fabric types) once per wizard. */
export function useMetadataCapabilities() {
  const [capabilities, setCapabilities] = useState<MetadataCapabilities | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    lzApi
      .getMetadataCapabilities()
      .then((result) => active && setCapabilities(result))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Could not load the metadata formats.'));
    return () => {
      active = false;
    };
  }, []);

  return { capabilities, error };
}
