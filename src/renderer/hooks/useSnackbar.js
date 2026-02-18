import { useState, useCallback } from 'react';

/**
 * Shared snackbar state hook.
 * @returns {{ open, message, show, close }} snackbar helpers
 */
export default function useSnackbar() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const show = useCallback((msg) => {
    setMessage(msg);
    setOpen(true);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { open, message, show, close };
}
