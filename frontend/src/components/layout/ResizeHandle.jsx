import { useRef, useState } from 'react';
import { cn } from '../../utils/cn';

const KEY_STEP = 24;

/**
 * Vertical drag handle for a panel that sits on the RIGHT edge of the screen:
 * dragging left makes the panel wider. Works with mouse, touch and pen (pointer events),
 * with the arrow keys when focused, and resets on double-click.
 */
export default function ResizeHandle({ width, min, max, defaultWidth, onChange, className }) {
  const [dragging, setDragging] = useState(false);
  const bodyStyle = useRef(null);

  const clamp = (value) => Math.round(Math.min(Math.max(value, min), max()));

  const begin = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    bodyStyle.current = { cursor: document.body.style.cursor, userSelect: document.body.style.userSelect };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    setDragging(true);
  };

  const move = (event) => {
    if (!dragging) return;
    onChange(clamp(window.innerWidth - event.clientX));
  };

  const end = (event) => {
    if (!dragging) return;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    document.body.style.cursor = bodyStyle.current?.cursor ?? '';
    document.body.style.userSelect = bodyStyle.current?.userSelect ?? '';
    setDragging(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowLeft') onChange(clamp(width + KEY_STEP));
    else if (event.key === 'ArrowRight') onChange(clamp(width - KEY_STEP));
    else if (event.key === 'Home') onChange(clamp(min));
    else if (event.key === 'End') onChange(clamp(max()));
    else return;
    event.preventDefault();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize assistant panel"
      aria-valuenow={width}
      aria-valuemin={min}
      aria-valuemax={Math.round(max())}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={() => onChange(clamp(defaultWidth))}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative z-10 hidden w-[7px] shrink-0 cursor-col-resize touch-none select-none xl:block',
        'focus-visible:outline-none',
        className,
      )}
    >
      {/* 1px line centred in a wider hit area */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line transition-colors',
          'group-hover:w-[2px] group-hover:bg-accent/70 group-focus-visible:w-[2px] group-focus-visible:bg-accent',
          dragging && 'w-[2px] bg-accent',
        )}
      />
    </div>
  );
}
