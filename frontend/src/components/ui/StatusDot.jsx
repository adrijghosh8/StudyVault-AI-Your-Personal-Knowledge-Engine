import { cn } from '../../utils/cn';

export const STATUS_LABELS = {
  checking: 'Checking…',
  healthy: 'Connected',
  disconnected: 'Disconnected',
};

export default function StatusDot({ status, className }) {
  const color =
    status === 'healthy' ? 'bg-ok' : status === 'disconnected' ? 'bg-err' : 'bg-warn';
  return (
    <span className={cn('relative inline-flex h-2 w-2 shrink-0', className)} aria-hidden="true">
      {status !== 'disconnected' && (
        <span
          className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-50',
            color,
            status === 'healthy' && '[animation-duration:3s]',
          )}
        />
      )}
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', color)} />
    </span>
  );
}
