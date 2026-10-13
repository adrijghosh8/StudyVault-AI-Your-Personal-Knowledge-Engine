import { useRef, useState } from 'react';
import KnowledgeHeader from './KnowledgeHeader';
import UploadDropzone from './UploadDropzone';
import UrlImporter from './UrlImporter';
import UploadQueue from './UploadQueue';
import UploadResults from './UploadResults';
import DocumentList from './DocumentList';
import ChunkInspector from './ChunkInspector';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useUploadQueue } from '../../hooks/useUploadQueue';

export default function KnowledgeBase({ docs, clearsOnShutdown, onRequestDeleteAll }) {
  const dropzoneRef = useRef(null);
  const [inspecting, setInspecting] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const uploads = useUploadQueue({ onFinished: docs.refresh });

  const confirmDelete = () => {
    const doc = pendingDelete;
    setPendingDelete(null);
    if (doc) docs.removeDocument(doc);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KnowledgeHeader
        count={docs.documents.length}
        loaded={docs.status === 'ready'}
        refreshing={docs.refreshing}
        hasDocuments={docs.documents.length > 0}
        onRefresh={docs.refresh}
        onDeleteAll={onRequestDeleteAll}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-5 sm:px-6">
          <section aria-labelledby="add-knowledge" className="flex flex-col gap-3">
            <h2 id="add-knowledge" className="text-sm font-medium text-ink">
              Add knowledge
            </h2>
            <UploadDropzone ref={dropzoneRef} onFiles={uploads.addFiles} disabled={uploads.busy} />
            <UrlImporter onAdd={uploads.addUrls} disabled={uploads.busy} />
            <UploadResults result={uploads.result} onDismiss={uploads.dismissResult} />
            <UploadQueue
              items={uploads.items}
              phase={uploads.phase}
              progress={uploads.progress}
              busy={uploads.busy}
              readyCount={uploads.readyCount}
              invalidCount={uploads.invalidCount}
              requestError={uploads.requestError}
              onRemove={uploads.removeItem}
              onClear={uploads.clear}
              onSubmit={uploads.submit}
            />
          </section>

          <DocumentList
            documents={docs.documents}
            status={docs.status}
            error={docs.error}
            deletingIds={docs.deletingIds}
            clearsOnShutdown={clearsOnShutdown}
            onRetry={docs.refresh}
            onInspect={setInspecting}
            onRequestDelete={setPendingDelete}
            onUploadClick={() => dropzoneRef.current?.open()}
          />
        </div>
      </div>

      <ChunkInspector doc={inspecting} onClose={() => setInspecting(null)} onMissing={docs.refresh} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this document?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from the knowledge base${
                pendingDelete.chunks !== undefined ? ` along with its ${pendingDelete.chunks} indexed chunks` : ''
              }, and its uploaded file will be deleted. This can’t be undone.`
            : ''
        }
        confirmLabel="Delete document"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
