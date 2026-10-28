import { useCallback, useMemo } from 'react';
import { useConnection } from '@/providers/ConnectionProvider';
import { useToast } from '@/providers/ToastProvider';

/** Ngữ cảnh gửi kèm mọi request discovery: connection active (X-Connection-Id) + workspace của nó. */
export function useDiscoveryContext() {
  const { activeConnection } = useConnection();
  const { showToast } = useToast();
  const connectionId = activeConnection?.id;
  const workspaceId = activeConnection?.workspaceId;

  const ctx = useMemo(
    () => (connectionId !== undefined ? { connectionId, workspaceId: workspaceId as string } : null),
    [connectionId, workspaceId],
  );

  const requireContext = useCallback(() => {
    if (!ctx) showToast('Set an active connection first (Connection tab).', 'warning');
    return ctx;
  }, [ctx, showToast]);

  return { ctx, requireContext };
}
