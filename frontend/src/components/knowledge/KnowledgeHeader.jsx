import { RefreshCw, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Menu from '../ui/Menu';
import { cn } from '../../utils/cn';
import { pluralize } from '../../utils/format';

export default function KnowledgeHeader({ count, loaded, refreshing, hasDocuments, onRefresh, onDeleteAll }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-semibold tracking-tight text-ink">Knowledge Base</h1>
          {loaded && (
            <span className="rounded-md border border-line bg-elevated px-1.5 py-0.5 text-[11px] tabular-nums text-soft">
              {pluralize(count, 'document')}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-soft">Your documents, one searchable knowledge base.</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Refresh documents"
          title="Refresh documents"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden="true" />
        </Button>
        <Menu
          label="Knowledge base actions"
          items={[
            {
              key: 'delete-all',
              label: 'Delete all documents…',
              icon: Trash2,
              danger: true,
              disabled: !hasDocuments,
              onSelect: onDeleteAll,
            },
          ]}
        />
      </div>
    </header>
  );
}
