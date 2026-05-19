import { useEffect, useRef } from 'react';

// Calls `callback` on a fixed interval. Always invokes the latest version of
// the callback without restarting the interval when the callback changes.
export function usePolling(callback: () => void, intervalMs: number) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
