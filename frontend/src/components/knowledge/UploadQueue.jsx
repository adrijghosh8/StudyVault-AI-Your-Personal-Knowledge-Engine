import { AlertCircle, File as FileIcon, Globe, Upload, X } from 'lucide-react';
import Button from '../ui/Button';
import UploadProgress from './UploadProgress';
import { formatBytes, pluralize } from '../../utils/format';
import { cn } from '../../utils/cn';

export default function UploadQueue({
  items,
  phase,
  progress,
  busy,
  readyCount,
  invalidCount,
  requestError,
  onRemove,
  onClear,
  onSubmit,
}) {
  if (!items.length && !busy && !requestError) return null;

  return (
    <section aria-label="Upload queue" className="overflow-hidden rounded-xl border border-line bg-panel">
      {items.length > 0 && (
        <ul className="max-h-56 divide-y divide-line overflow-y-auto">
          {items.map((item) => {
            const failed = Boolean(item.error || item.serverError);
            const Icon = item.kind === 'url' ? Globe : FileIcon;
            return (
              <li key={item.key} className="flex items-center gap-3 px-3 py-2.5">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-elevated',
                    failed ? 'border-err/40 text-err' : 'border-line text-soft',
                  )}
                  aria-hidden="true"
                >
                  {failed ? <AlertCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink" title={item.name}>
                    {item.name}
                  </p>
                  <p className={cn('truncate text-xs', failed ? 'text-[#e49795]' : 'text-mute')}>
                    {item.error || item.serverError || (item.kind === 'file' ? formatBytes(item.size) : 'Web page')}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-md border px-1.5 py-0.5 text-[11px]',
                    item.error
                      ? 'border-err/40 text-[#e49795]'
                      : item.serverError
                        ? 'border-err/40 text-[#e49795]'
                        : 'border-line text-mute',
                  )}
                >
                  {item.error ? 'Invalid' : item.serverError ? 'Failed' : 'Ready'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${item.name} from the queue`}
                  onClick={() => onRemove(item.key)}
                  disabled={busy}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {busy && <UploadProgress phase={phase} progress={progress} />}

      {requestError && !busy && (
        <p role="alert" className="flex items-start gap-2 border-t border-line px-3 py-2.5 text-sm text-[#e49795]">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {requestError}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line bg-[#0f0f0f] px-3 py-2.5">
        <p className="min-w-0 truncate text-xs text-soft">
          {pluralize(readyCount, 'item')} ready
          {invalidCount > 0 && <span className="text-[#e49795]"> · {invalidCount} invalid (won’t be sent)</span>}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClear} disabled={busy}>
            Clear
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Upload}
            loading={busy}
            disabled={readyCount === 0}
            onClick={onSubmit}
          >
            Upload {readyCount > 0 ? readyCount : ''}
          </Button>
        </div>
      </div>
    </section>
  );
}
