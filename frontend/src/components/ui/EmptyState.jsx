import { cn } from '../../utils/cn';

export default function EmptyState({ icon: Icon, title, description, action, tone = 'neutral', className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      {Icon && (
        <div
          className={cn(
            'mb-3 flex h-10 w-10 items-center justify-center rounded-xl border bg-elevated',
            tone === 'error' ? 'border-err/40 text-err' : 'border-line text-soft',
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-medium text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-relaxed text-soft">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
