import { RefreshCw, Trash2 } from 'lucide-react';
import Dialog from '../ui/Dialog';
import Button from '../ui/Button';
import StatusDot, { STATUS_LABELS } from '../ui/StatusDot';
import { API_TARGET } from '../../services/api';
import { formatTime } from '../../utils/format';

export default function SettingsDialog({ open, onClose, health, documentCount, onDeleteAll }) {
  const { clearsOnShutdown } = health;
  return (
    <Dialog open={open} onClose={onClose} title="Settings" description="Connection details and data management.">
      <div className="space-y-5">
        <section aria-labelledby="settings-connection">
          <h3 id="settings-connection" className="mb-2 text-xs font-medium uppercase tracking-wide text-mute">
            Connection
          </h3>
          <div className="rounded-xl border border-line bg-bg p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-ink" role="status">
                <StatusDot status={health.status} />
                {STATUS_LABELS[health.status]}
              </div>
              <Button size="sm" icon={RefreshCw} onClick={health.recheck} disabled={health.status === 'checking'}>
                Re-check
              </Button>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-xs">
              <dt className="text-mute">Backend</dt>
              <dd className="break-all font-mono text-soft">{API_TARGET}</dd>
              {health.lastChecked && (
                <>
                  <dt className="text-mute">Last checked</dt>
                  <dd className="text-soft">{formatTime(health.lastChecked)}</dd>
                </>
              )}
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-mute">
              Change the backend address with <span className="font-mono">VITE_API_BASE_URL</span> in your{' '}
              <span className="font-mono">.env</span> file, then restart the dev server.
            </p>
          </div>
        </section>

        <section aria-labelledby="settings-data">
          <h3 id="settings-data" className="mb-2 text-xs font-medium uppercase tracking-wide text-mute">
            Data
          </h3>
          <div className="rounded-xl border border-err/30 bg-err/5 p-3">
            <p className="text-sm font-medium text-ink">Delete all documents</p>
            <p className="mt-1 text-xs leading-relaxed text-soft">
              Removes every indexed document and uploaded file from the backend.
              {clearsOnShutdown === true && ' The backend is also set to clear all indexed data whenever it shuts down.'}
              {clearsOnShutdown === false && ' Documents are kept when the backend restarts, so this is the only way they are removed.'}
            </p>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              className="mt-3"
              disabled={documentCount === 0}
              onClick={onDeleteAll}
            >
              Delete all documents…
            </Button>
          </div>
        </section>
      </div>
    </Dialog>
  );
}
