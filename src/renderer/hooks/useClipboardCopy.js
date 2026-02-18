import { useCallback } from 'react';
import useSnackbar from './useSnackbar';

/**
 * Copy text to clipboard with error handling and snackbar feedback.
 * @returns {{ copy, snackbar }} copy fn and snackbar state for rendering
 */
export default function useClipboardCopy() {
  const snackbar = useSnackbar();

  const copy = useCallback(
    async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        snackbar.show('Copied to clipboard');
      } catch {
        snackbar.show('Failed to copy');
      }
    },
    [snackbar],
  );

  return { copy, snackbar };
}
