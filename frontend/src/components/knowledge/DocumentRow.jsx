import { motion } from 'framer-motion';
import { Copy, ExternalLink, Layers, Link2, Trash2 } from 'lucide-react';
import FileTypeIcon from './FileTypeIcon';
import Menu from '../ui/Menu';
import { Spinner } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { copyText } from '../../utils/clipboard';

function useDocMenu(doc, { onInspect, onDelete }) {
  const toast = useToast();

  const copy = async (text, what) => {
    const ok = await copyText(text);
    if (ok) toast.success(`${what} copied.`);
    else toast.error('Could not copy to the clipboard.');
  };

  const items = [
    {
      key: 'inspect',
      label: 'Inspect chunks',
      icon: Layers,
      disabled: !doc.id,
      onSelect: () => onInspect(doc),
    },
    {
      key: 'copy-id',
      label: 'Copy document ID',
      icon: Copy,
      disabled: !doc.id,
      onSelect: () => copy(doc.id, 'Document ID'),
    },
  ];

  if (doc.sourceUrl) {
    items.push(
      { key: 'copy-url', label: 'Copy source URL', icon: Link2, onSelect: () => copy(doc.sourceUrl, 'URL') },
      {
        key: 'open-url',
        label: 'Open source page',
        icon: ExternalLink,
        onSelect: () => window.open(doc.sourceUrl, '_blank', 'noopener,noreferrer'),
      },
    );
  }

  items.push(
    { separator: true, key: 'sep' },
    {
      key: 'delete',
      label: 'Delete document…',
      icon: Trash2,
      danger: true,
      disabled: !doc.id,
      onSelect: () => onDelete(doc),
    },
  );
  return items;
}

function subline(doc) {
  return doc.sourceUrl || '';
}

/** Desktop table row. */
export function DocumentRow({ doc, caps, deleting, onInspect, onDelete }) {
  const items = useDocMenu(doc, { onInspect, onDelete });
  const sub = subline(doc);

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: deleting ? 0.5 : 1 }}
      transition={{ duration: 0.2 }}
      aria-busy={deleting || undefined}
      className="border-t border-line transition-colors first:border-t-0 hover:bg-elevated/60"
    >
      <td className="py-2.5 pl-4 pr-3">
        <div className="flex min-w-0 items-center gap-3">
          <FileTypeIcon doc={doc} />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onInspect(doc)}
              disabled={!doc.id || deleting}
              title={doc.name}
              className="block max-w-full truncate text-left text-sm font-medium text-ink underline-offset-2 hover:underline disabled:no-underline"
            >
              {doc.name}
            </button>
            {sub && (
              <p className="truncate text-xs text-mute" title={sub}>
                {sub}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-3 text-xs text-soft">{doc.typeLabel || '—'}</td>
      {caps.chunks && (
        <td className="px-3 text-right text-xs tabular-nums text-soft">{doc.chunks ?? '—'}</td>
      )}
      <td className="pr-3 text-right">
        {deleting ? (
          <span className="inline-flex h-8 w-8 items-center justify-center text-soft" role="status" aria-label="Deleting">
            <Spinner />
          </span>
        ) : (
          <Menu label={`Actions for ${doc.name}`} items={items} />
        )}
      </td>
    </motion.tr>
  );
}

/** Mobile card. */
export function DocumentCard({ doc, caps, deleting, onInspect, onDelete }) {
  const items = useDocMenu(doc, { onInspect, onDelete });
  const sub = subline(doc);

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: deleting ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-busy={deleting || undefined}
      className="rounded-xl border border-line bg-panel p-3"
    >
      <div className="flex items-start gap-3">
        <FileTypeIcon doc={doc} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onInspect(doc)}
            disabled={!doc.id || deleting}
            className="block max-w-full truncate text-left text-sm font-medium text-ink"
            title={doc.name}
          >
            {doc.name}
          </button>
          {sub && <p className="truncate text-xs text-mute">{sub}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-soft">
            {doc.typeLabel && <span>{doc.typeLabel}</span>}
            {caps.chunks && doc.chunks !== undefined && <span>{doc.chunks} chunks</span>}
          </div>
        </div>
        {deleting ? (
          <span className="inline-flex h-8 w-8 items-center justify-center text-soft" role="status" aria-label="Deleting">
            <Spinner />
          </span>
        ) : (
          <Menu label={`Actions for ${doc.name}`} items={items} />
        )}
      </div>
    </motion.li>
  );
}
