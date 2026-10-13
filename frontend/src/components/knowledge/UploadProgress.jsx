import { Check } from 'lucide-react';
import { cn } from '../../utils/cn';

const STAGES = [
  { id: 'preparing', label: 'Preparing' },
  { id: 'uploading', label: 'Uploading' },
  { id: 'processing', label: 'Processing & indexing' },
];

/**
 * Only stages the client can actually observe are shown. Uploading is measured;
 * processing happens inside the same request, so it is an indeterminate wait.
 */
export default function UploadProgress({ phase, progress }) {
  const activeIndex = STAGES.findIndex((s) => s.id === phase);
  const determinate = phase === 'uploading';
  const percent = Math.round(progress * 100);

  return (
    <div className="border-t border-line px-3 py-3" role="status" aria-live="polite">
      <ol className="mb-2.5 flex flex-wrap items-center gap-x-4 gap-y-1">
        {STAGES.map((stage, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={stage.id}
              className={cn(
                'flex items-center gap-1.5 text-xs transition-colors',
                active ? 'text-ink' : done ? 'text-soft' : 'text-mute',
              )}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border',
                  done && 'border-ok/60 bg-ok/15 text-ok',
                  active && 'border-accent',
                  !done && !active && 'border-line',
                )}
              >
                {done ? (
                  <Check className="h-2.5 w-2.5" aria-hidden="true" />
                ) : active ? (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                ) : null}
              </span>
              {stage.label}
              {active && determinate && <span className="tabular-nums text-soft">{percent}%</span>}
            </li>
          );
        })}
      </ol>
      <div
        className="relative h-1 overflow-hidden rounded-full bg-[#1f1f1f]"
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={determinate ? 0 : undefined}
        aria-valuemax={determinate ? 100 : undefined}
        aria-valuenow={determinate ? percent : undefined}
      >
        {determinate ? (
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${Math.max(percent, 3)}%` }}
          />
        ) : (
          <div className="absolute inset-y-0 left-0 w-1/3 animate-indeterminate rounded-full bg-accent" />
        )}
      </div>
      {phase === 'processing' && (
        <p className="mt-2 text-xs text-mute">
          Files are sent. The server is extracting text and indexing — this can take a while for large
          documents.
        </p>
      )}
    </div>
  );
}
