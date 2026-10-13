import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export function Spinner({ className }) {
  return (
    <svg
      className={cn('h-4 w-4 animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const variants = {
  primary: 'bg-accent text-white hover:bg-[#2f6be0]',
  secondary: 'border border-line bg-elevated text-ink hover:bg-[#212121] hover:border-[#333]',
  ghost: 'text-soft hover:bg-elevated hover:text-ink',
  danger: 'border border-err/40 bg-err/10 text-[#e49795] hover:bg-err/20',
  'danger-solid': 'bg-[#b0504d] text-white hover:bg-[#c25b58]',
};

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-3.5 text-sm',
  icon: 'h-8 w-8 p-0',
};

const Button = forwardRef(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 select-none items-center justify-center rounded-lg font-medium',
        'transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97]',
        loading ? 'cursor-wait' : 'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {/* Content stays in flow (hidden while loading) so the button never changes size. */}
      <span className={cn('inline-flex items-center justify-center gap-2', loading && 'invisible')}>
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </span>
      )}
    </button>
  );
});

export default Button;
