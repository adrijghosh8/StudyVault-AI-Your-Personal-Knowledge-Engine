import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

const placements = {
  center: {
    wrapper: 'items-center justify-center p-4',
    panel: 'w-full rounded-2xl',
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
  },
  right: {
    wrapper: 'justify-end',
    panel: 'h-full w-full max-w-xl border-y-0 border-r-0 sm:rounded-l-2xl',
    initial: { opacity: 0, x: 48 },
    animate: { opacity: 1, x: 0 },
  },
  left: {
    wrapper: 'justify-start',
    panel: 'h-full w-full max-w-[272px] border-y-0 border-l-0 bg-sidebar',
    initial: { opacity: 0, x: -48 },
    animate: { opacity: 1, x: 0 },
  },
};

export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  placement = 'center',
  size = 'md',
  dismissible = true,
  hideHeader = false,
  className,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);
  onCloseRef.current = onClose;
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return undefined;

    const previous = document.activeElement;
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector('[data-autofocus]') || panel;
      target?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dismissibleRef.current) {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;

      const nodes = Array.from(panelRef.current.querySelectorAll(FOCUSABLE));
      if (!nodes.length) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      if (previous && document.contains(previous)) previous.focus?.();
    };
  }, [open]);

  const config = placements[placement] || placements.center;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div key="dialog-root" className={cn('fixed inset-0 z-50 flex', config.wrapper)}>
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => dismissible && onClose?.()}
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            className={cn(
              'relative flex max-h-full flex-col border border-line bg-panel shadow-2xl shadow-black/60 outline-none',
              config.panel,
              placement === 'center' && sizes[size],
              className,
            )}
            initial={config.initial}
            animate={config.animate}
            exit={config.initial}
            transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {hideHeader ? (
              <h2 id={titleId} className="sr-only">
                {title}
              </h2>
            ) : (
              <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <h2 id={titleId} className="truncate text-sm font-semibold text-ink">
                    {title}
                  </h2>
                  {description && (
                    <p id={descId} className="mt-1 text-sm leading-relaxed text-soft">
                      {description}
                    </p>
                  )}
                </div>
                {dismissible && (
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="-mr-1.5 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-soft transition-colors hover:bg-elevated hover:text-ink"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </header>
            )}
            <div className={cn('min-h-0 flex-1 overflow-y-auto', hideHeader ? '' : 'px-5 py-4')}>
              {children}
            </div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
