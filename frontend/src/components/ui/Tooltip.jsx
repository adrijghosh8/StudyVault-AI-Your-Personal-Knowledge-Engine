import { cn } from '../../utils/cn';

/** CSS-only tooltip, shown on hover and keyboard focus. Used for icon-only navigation. */
export default function Tooltip({ label, children, className }) {
  return (
    <span className={cn('group/tip relative flex w-full', className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full top-1/2 z-[65] ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-elevated px-2 py-1 text-xs text-ink opacity-0 shadow-lg shadow-black/40 transition-opacity duration-150 group-focus-within/tip:opacity-100 group-hover/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
