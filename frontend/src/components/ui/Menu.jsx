import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import Button from './Button';
import { cn } from '../../utils/cn';

/**
 * items: Array<{ key, label, icon?, onSelect, danger?, disabled? } | { separator: true, key }>
 * The popover is portalled to <body> so scrolling/overflow containers never clip it.
 */
export default function Menu({ label = 'More actions', items, icon: Icon = MoreHorizontal, disabled, className }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    const estimated = items.filter((i) => !i.separator).length * 36 + 16;
    const flip = window.innerHeight - rect.bottom < estimated + 16 && rect.top > estimated;
    setPos({
      right: Math.max(8, window.innerWidth - rect.right),
      top: flip ? undefined : rect.bottom + 6,
      bottom: flip ? window.innerHeight - rect.top + 6 : undefined,
    });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (menuRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    };
    const onViewportChange = () => setOpen(false);

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);

    const raf = requestAnimationFrame(() => {
      menuRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, close]);

  const onMenuKeyDown = (event) => {
    const nodes = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]:not([disabled])'));
    if (!nodes.length) return;
    const index = nodes.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nodes[(index + 1) % nodes.length].focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nodes[(index - 1 + nodes.length) % nodes.length].focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      nodes[0].focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      nodes[nodes.length - 1].focus();
    } else if (event.key === 'Tab') {
      close();
    }
  };

  const select = (item) => {
    close(true);
    item.onSelect?.();
  };

  return (
    <>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={toggle}
        className={className}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </Button>
      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              key="menu"
              id={menuId}
              ref={menuRef}
              role="menu"
              aria-label={label}
              onKeyDown={onMenuKeyDown}
              style={{ position: 'fixed', ...pos }}
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              transition={{ duration: 0.14 }}
              className="z-[60] min-w-[210px] rounded-xl border border-line bg-elevated p-1 shadow-xl shadow-black/60"
            >
              {items.map((item) =>
                item.separator ? (
                  <div key={item.key} role="separator" className="my-1 h-px bg-line" />
                ) : (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    disabled={item.disabled}
                    onClick={() => select(item)}
                    className={cn(
                      'flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm outline-none transition-colors',
                      'focus:bg-[#242424] hover:bg-[#242424] disabled:cursor-not-allowed disabled:opacity-40',
                      item.danger ? 'text-[#e49795]' : 'text-ink',
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden="true" />}
                    <span className="truncate">{item.label}</span>
                  </button>
                ),
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
