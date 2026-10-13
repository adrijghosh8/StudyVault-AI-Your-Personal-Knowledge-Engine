import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

const ToastContext = createContext(null);

const icons = {
  success: { Icon: CheckCircle2, color: 'text-ok' },
  error: { Icon: AlertCircle, color: 'text-err' },
  warning: { Icon: AlertTriangle, color: 'text-warn' },
  info: { Icon: Info, color: 'text-soft' },
};

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, options = {}) => {
      counter += 1;
      const id = counter;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      const duration = options.duration ?? (type === 'error' ? 7000 : 4500);
      timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        >
          <AnimatePresence initial={false}>
            {toasts.map((toast) => {
              const { Icon, color } = icons[toast.type] || icons.info;
              return (
                <motion.div
                  key={toast.id}
                  layout
                  role={toast.type === 'error' ? 'alert' : 'status'}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                  transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-elevated px-3.5 py-3 shadow-xl shadow-black/50"
                >
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', color)} aria-hidden="true" />
                  <p className="min-w-0 flex-1 break-words text-sm leading-snug text-ink">{toast.message}</p>
                  <button
                    type="button"
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                    className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-mute transition-colors hover:bg-[#262626] hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
