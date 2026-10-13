import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import CopyButton from '../ui/CopyButton';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { getDocumentChunks } from '../../services/api';
import { isAbort, toMessage } from '../../utils/apiError';
import { cn } from '../../utils/cn';
import { pluralize } from '../../utils/format';

const PAGE_SIZE = 50;

function ChunkItem({ chunk, position, expanded, onToggle }) {
  const preview = chunk.text.replace(/\s+/g, ' ').trim();
  return (
    <li className="rounded-xl border border-line bg-[#0f0f0f]">
      <div className="flex items-center gap-1 pr-1.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-2 rounded-xl px-3 py-2.5 text-left"
        >
          <ChevronRight
            className={cn('mt-0.5 h-4 w-4 shrink-0 text-mute transition-transform duration-150', expanded && 'rotate-90')}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-ink">Chunk {position}</span>
              {chunk.page !== undefined && <span className="text-[11px] tabular-nums text-mute">Page {chunk.page}</span>}
              <span className="text-[11px] tabular-nums text-mute">{chunk.text.length.toLocaleString()} chars</span>
            </span>
            {!expanded && (
              <span className="mt-1 line-clamp-2 block break-words text-xs leading-relaxed text-soft">
                {preview || 'No text content.'}
              </span>
            )}
          </span>
        </button>
        <CopyButton text={chunk.text} label={`Copy chunk ${position} text`} />
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-line px-3 py-3">
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">
            {chunk.text || 'No text content.'}
          </p>
          {chunk.metadata.length > 0 && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 rounded-lg border border-line bg-bg p-2.5 text-xs">
              {chunk.metadata.map(([key, value]) => (
                <div key={key} className="contents">
                  <dt className="font-mono text-mute">{key}</dt>
                  <dd className="break-words font-mono text-soft">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </li>
  );
}

export default function ChunkInspector({ doc, onClose, onMissing }) {
  const open = Boolean(doc);
  const documentId = doc?.id;
  const [state, setState] = useState({ status: 'idle', data: null, error: null, code: 0 });
  const [expanded, setExpanded] = useState(() => new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!documentId) return undefined;
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null, code: 0 });
    setExpanded(new Set());
    setVisibleCount(PAGE_SIZE);

    getDocumentChunks(documentId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data, error: null, code: 0 });
      })
      .catch((err) => {
        if (isAbort(err)) return;
        setState({
          status: 'error',
          data: null,
          error: toMessage(err, 'Could not load the chunks for this document.'),
          code: err?.status ?? 0,
        });
      });

    return () => controller.abort();
  }, [documentId, attempt]);

  const toggle = useCallback((key) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const chunks = state.data?.chunks ?? [];
  const allText = useMemo(() => chunks.map((c) => c.text).join('\n\n'), [chunks]);
  const allExpanded = chunks.length > 0 && expanded.size === chunks.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      placement="right"
      title={doc ? `Chunks · ${doc.name}` : 'Chunks'}
      description={
        state.status === 'ready'
          ? `${pluralize(state.data.total, 'chunk')} indexed for the assistant to retrieve from.`
          : 'The text segments the assistant can retrieve from this document.'
      }
    >
      {state.status === 'loading' && (
        <div className="space-y-2" role="status" aria-label="Loading chunks">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-line bg-[#0f0f0f] p-3">
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-1.5 h-3 w-4/5" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <EmptyState
          icon={AlertTriangle}
          tone="error"
          title={state.code === 404 ? 'Document not found' : 'Couldn’t load chunks'}
          description={
            state.code === 404
              ? 'This document no longer exists on the backend. Refresh the list to see what is currently indexed.'
              : state.error
          }
          action={
            state.code === 404 ? (
              <Button
                icon={RefreshCw}
                onClick={() => {
                  onMissing?.();
                  onClose();
                }}
              >
                Refresh list
              </Button>
            ) : (
              <Button icon={RefreshCw} onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </Button>
            )
          }
        />
      )}

      {state.status === 'ready' && (
        <div className="space-y-3">
          {chunks.length === 0 ? (
            <EmptyState title="No chunks returned" description="The backend reported no chunk content for this document." />
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-soft">
                  Showing {Math.min(visibleCount, chunks.length)} of {chunks.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setExpanded(allExpanded ? new Set() : new Set(chunks.map((c) => c.key)))
                    }
                  >
                    {allExpanded ? 'Collapse all' : 'Expand all'}
                  </Button>
                  <CopyButton text={allText} label="Copy all chunk text" />
                </div>
              </div>
              <ul className="space-y-2">
                {chunks.slice(0, visibleCount).map((chunk, index) => (
                  <ChunkItem
                    key={chunk.key}
                    chunk={chunk}
                    position={index + 1}
                    expanded={expanded.has(chunk.key)}
                    onToggle={() => toggle(chunk.key)}
                  />
                ))}
              </ul>
              {visibleCount < chunks.length && (
                <Button className="w-full" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                  Show {Math.min(PAGE_SIZE, chunks.length - visibleCount)} more
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </Dialog>
  );
}
