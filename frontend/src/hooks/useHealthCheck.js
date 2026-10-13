import { useCallback, useEffect, useRef, useState } from 'react';
import { checkHealth } from '../services/api';
import { isAbort } from '../utils/apiError';

/**
 * Polls GET / sparingly: every 30s while healthy, every 15s while disconnected,
 * and not at all while the tab is hidden (it re-checks as soon as the tab returns).
 */
export function useHealthCheck({ healthyInterval = 30000, retryInterval = 15000 } = {}) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'healthy' | 'disconnected'
  const [lastChecked, setLastChecked] = useState(null);
  const [clearsOnShutdown, setClearsOnShutdown] = useState(undefined);
  const statusRef = useRef('checking');
  const timerRef = useRef(null);
  const controllerRef = useRef(null);

  const run = useCallback(
    async (showChecking) => {
      clearTimeout(timerRef.current);

      const schedule = () => {
        const delay = statusRef.current === 'healthy' ? healthyInterval : retryInterval;
        timerRef.current = setTimeout(() => run(false), delay);
      };

      if (document.hidden) {
        schedule();
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (showChecking) {
        statusRef.current = 'checking';
        setStatus('checking');
      }

      let next;
      try {
        const result = await checkHealth(controller.signal);
        next = result.healthy ? 'healthy' : 'disconnected';
        if (!controller.signal.aborted) setClearsOnShutdown(result.clearsOnShutdown);
      } catch (err) {
        if (isAbort(err)) return;
        next = 'disconnected';
      }
      if (controller.signal.aborted) return;

      statusRef.current = next;
      setStatus(next);
      setLastChecked(new Date());
      schedule();
    },
    [healthyInterval, retryInterval],
  );

  useEffect(() => {
    run(true);
    const onVisibility = () => {
      if (!document.hidden) run(false);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timerRef.current);
      controllerRef.current?.abort();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [run]);

  const recheck = useCallback(() => run(true), [run]);

  return { status, lastChecked, clearsOnShutdown, recheck };
}
