import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, FolderOpen, Search, SearchX, Upload, X } from 'lucide-react';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Skeleton from '../ui/Skeleton';
import { DocumentCard, DocumentRow } from './DocumentRow';
import { cn } from '../../utils/cn';

const comparators = {
  name: (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  type: (a, b) => (a.typeLabel || '').localeCompare(b.typeLabel || ''),
  chunks: (a, b) => (a.chunks ?? -1) - (b.chunks ?? -1),
};

function SortHeader({ label, field, sort, onSort, align = 'left', className }) {
  const active = sort.key === field;
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-3 py-2 font-medium', align === 'right' ? 'text-right' : 'text-left', className)}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          'inline-flex items-center gap-1 rounded text-[11px] uppercase tracking-wide transition-colors hover:text-ink',
          active ? 'text-ink' : 'text-mute',
        )}
      >
        {label}
        <Icon className="h-3 w-3" aria-hidden="true" />
      </button>
    </th>
  );
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading documents" className="overflow-hidden rounded-xl border border-line bg-panel">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="hidden h-3 w-12 sm:block" />
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function DocumentList({
  documents,
  status,
  error,
  deletingIds,
  clearsOnShutdown,
  onRetry,
  onInspect,
  onRequestDelete,
  onUploadClick,
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  // The backend reports a chunk count per document; hide the column if it ever doesn't.
  const caps = useMemo(() => ({ chunks: documents.some((d) => d.chunks !== undefined) }), [documents]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? documents.filter((d) =>
          [d.name, d.id, d.typeLabel, d.sourceUrl].some((v) => v && String(v).toLowerCase().includes(q)),
        )
      : documents.slice();
    const compare = comparators[sort.key] || comparators.name;
    filtered.sort((a, b) => (sort.dir === 'asc' ? compare(a, b) : compare(b, a)));
    return filtered;
  }, [documents, query, sort]);

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'type' ? 'asc' : 'desc' },
    );

  const sortOptions = [
    { value: 'name:asc', label: 'Name (A–Z)' },
    { value: 'name:desc', label: 'Name (Z–A)' },
    { value: 'type:asc', label: 'Type' },
    ...(caps.chunks ? [{ value: 'chunks:desc', label: 'Most chunks' }] : []),
  ];

  let body;
  if (status === 'loading') {
    body = <ListSkeleton />;
  } else if (status === 'error') {
    body = (
      <div className="rounded-xl border border-line bg-panel">
        <EmptyState
          icon={AlertTriangle}
          tone="error"
          title="Couldn’t load your documents"
          description={error}
          action={
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (documents.length === 0) {
    body = (
      <div className="rounded-xl border border-dashed border-line bg-panel">
        <EmptyState
          icon={FolderOpen}
          title="No documents yet"
          description={`Upload files or import a web page to build the knowledge base the assistant answers from.${
            clearsOnShutdown ? ' Indexed documents are cleared when the backend shuts down.' : ''
          }`}
          action={
            <Button variant="primary" icon={Upload} onClick={onUploadClick}>
              Upload files
            </Button>
          }
        />
      </div>
    );
  } else if (visible.length === 0) {
    body = (
      <div className="rounded-xl border border-line bg-panel">
        <EmptyState
          icon={SearchX}
          title="No matching documents"
          description={`Nothing in your knowledge base matches “${query.trim()}”.`}
          action={
            <Button variant="secondary" onClick={() => setQuery('')}>
              Clear search
            </Button>
          }
        />
      </div>
    );
  } else {
    const rowProps = (doc, index) => ({
      key: doc.key || index,
      doc,
      caps,
      deleting: doc.id ? deletingIds.has(doc.id) : false,
      onInspect,
      onDelete: onRequestDelete,
    });
    body = (
      <>
        <div className="hidden overflow-hidden rounded-xl border border-line bg-panel md:block">
          <table className="w-full table-fixed text-left">
            <caption className="sr-only">Documents in the knowledge base</caption>
            <colgroup>
              <col />
              <col className="w-20" />
              {caps.chunks && <col className="w-24" />}
              <col className="w-14" />
            </colgroup>
            <thead>
              <tr className="border-b border-line bg-[#0f0f0f]">
                <SortHeader label="Name" field="name" sort={sort} onSort={toggleSort} className="pl-4" />
                <SortHeader label="Type" field="type" sort={sort} onSort={toggleSort} />
                {caps.chunks && <SortHeader label="Chunks" field="chunks" sort={sort} onSort={toggleSort} align="right" />}
                <th scope="col" className="px-3 py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((doc, index) => {
                const { key, ...props } = rowProps(doc, index);
                return <DocumentRow key={key} {...props} />;
              })}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-col gap-2 md:hidden">
          {visible.map((doc, index) => {
            const { key, ...props } = rowProps(doc, index);
            return <DocumentCard key={key} {...props} />;
          })}
        </ul>
      </>
    );
  }

  const showTools = status === 'ready' && documents.length > 0;

  return (
    <section aria-label="Documents" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-ink">
          Documents
          {showTools && (
            <span className="ml-2 text-xs font-normal tabular-nums text-mute">
              {visible.length === documents.length ? documents.length : `${visible.length} of ${documents.length}`}
            </span>
          )}
        </h2>
        {showTools && (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
            <label className="sr-only" htmlFor="doc-sort">
              Sort documents
            </label>
            <select
              id="doc-sort"
              value={`${sort.key}:${sort.dir}`}
              onChange={(e) => {
                const [key, dir] = e.target.value.split(':');
                setSort({ key, dir });
              }}
              className="h-8 rounded-lg border border-line bg-panel px-2 text-xs text-soft outline-none focus:border-[#4a4a4a] md:hidden"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="relative min-w-0 flex-1 sm:w-60 sm:flex-none">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mute"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search documents"
                placeholder="Search documents"
                className="h-8 w-full rounded-lg border border-line bg-panel pl-8 pr-8 text-xs text-ink outline-none transition-colors placeholder:text-mute focus:border-[#4a4a4a] [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-mute hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {body}
    </section>
  );
}
