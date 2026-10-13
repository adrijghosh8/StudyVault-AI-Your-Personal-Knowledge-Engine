import { motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function UploadResults({ result, onDismiss }) {
  if (!result) return null;
  const { total, successful, failed, results } = result;

  const tone = failed === 0 ? 'success' : successful === 0 ? 'error' : 'partial';
  const meta = {
    success: { title: 'Upload complete', Icon: CheckCircle2, accent: 'text-ok', border: 'border-ok/30' },
    partial: { title: 'Partially completed', Icon: AlertTriangle, accent: 'text-warn', border: 'border-warn/30' },
    error: { title: 'Upload failed', Icon: AlertCircle, accent: 'text-err', border: 'border-err/30' },
  }[tone];
  const { Icon } = meta;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="Upload results"
      className={cn('overflow-hidden rounded-xl border bg-panel', meta.border)}
    >
      <header className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Icon className={cn('h-4 w-4 shrink-0', meta.accent)} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{meta.title}</p>
            <p className="text-xs text-soft">
              <span>{total === 1 ? '1 item' : `${total} items`}</span>
              <span aria-hidden="true"> · </span>
              <span className="text-ok">{successful} succeeded</span>
              <span aria-hidden="true"> · </span>
              <span className={failed ? 'text-[#e49795]' : undefined}>{failed} failed</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss upload results"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-soft transition-colors hover:bg-elevated hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      {results.length > 0 && (
        <ul className="max-h-48 divide-y divide-line overflow-y-auto border-t border-line">
          {results.map((r, index) => (
            <li key={`${r.id ?? r.name}-${index}`} className="flex items-start gap-2.5 px-3 py-2">
              {r.status === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-label="Succeeded" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-err" aria-label="Failed" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink" title={r.name}>
                  {r.name}
                </p>
                <p className={cn('text-xs', r.status === 'success' ? 'text-mute' : 'text-[#e49795]')}>
                  {r.status === 'success'
                    ? r.chunks !== undefined
                      ? `Indexed as ${r.chunks} ${r.chunks === 1 ? 'chunk' : 'chunks'}`
                      : 'Indexed'
                    : r.error || 'Could not be processed.'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.section>
  );
}
