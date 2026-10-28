import { useCallback } from 'react';
import { useToast } from '@/providers/ToastProvider';

function legacyCopy(text: string) {
  const temp = document.createElement('textarea');
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  document.body.removeChild(temp);
}

export function useClipboard() {
  const { showToast } = useToast();
  return useCallback(
    async (text: string, successMsg = 'Copied to clipboard') => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        legacyCopy(text);
      }
      showToast(successMsg, 'success');
    },
    [showToast],
  );
}
