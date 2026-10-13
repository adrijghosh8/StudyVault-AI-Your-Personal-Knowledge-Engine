import { useCallback, useEffect, useRef, useState } from 'react';
import { deleteAllDocuments, deleteDocument, listDocuments } from '../services/api';
import { isAbort, toMessage } from '../utils/apiError';
import { useToast } from '../components/ui/Toast';

/** Owns the knowledge-base list. Everything shown comes from GET /documents. */
export function useDocuments() {
  const toast = useToast();
  const [documents, setDocuments] = useState([]);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingIds, setDeletingIds] = useState(() => new Set());
  const [deletingAll, setDeletingAll] = useState(false);

  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const deletingAllRef = useRef(false);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const requestId = ++requestIdRef.current;

    setRefreshing(true);
    if (!hasLoadedRef.current) setStatus('loading');

    try {
      const list = await listDocuments(controller.signal);
      if (requestId !== requestIdRef.current) return;
      hasLoadedRef.current = true;
      setDocuments(list);
      setError(null);
      setStatus('ready');
    } catch (err) {
      if (isAbort(err) || requestId !== requestIdRef.current) return;
      const message = toMessage(err, 'Could not load your documents.');
      if (hasLoadedRef.current) {
        toast.error(message);
      } else {
        setError(message);
        setStatus('error');
      }
    } finally {
      if (requestId === requestIdRef.current) setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
    return () => controllerRef.current?.abort();
  }, [refresh]);

  const removeDocument = useCallback(
    async (doc) => {
      if (!doc?.id) return false;
      setDeletingIds((prev) => new Set(prev).add(doc.id));
      try {
        const result = await deleteDocument(doc.id);
        const chunks = Number.isFinite(result?.deleted_chunks) ? ` (${result.deleted_chunks} chunks removed)` : '';
        toast.success(`Deleted “${doc.name}”${chunks}.`);
        await refresh();
        return true;
      } catch (err) {
        toast.error(toMessage(err, 'Could not delete that document.'));
        // A 404 means the list is stale (e.g. the backend restarted); resync it.
        if (err?.status === 404) refresh();
        return false;
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(doc.id);
          return next;
        });
      }
    },
    [refresh, toast],
  );

  const removeAll = useCallback(async () => {
    if (deletingAllRef.current) return false;
    deletingAllRef.current = true;
    setDeletingAll(true);
    try {
      const result = await deleteAllDocuments();
      const counts =
        Number.isFinite(result?.deleted_chunks) && Number.isFinite(result?.deleted_files)
          ? ` (${result.deleted_chunks} chunks, ${result.deleted_files} files)`
          : '';
      toast.success(`${result?.message || 'All documents were deleted.'}${counts}`);
      await refresh();
      return true;
    } catch (err) {
      toast.error(toMessage(err, 'Could not delete your documents.'));
      return false;
    } finally {
      deletingAllRef.current = false;
      setDeletingAll(false);
    }
  }, [refresh, toast]);

  return {
    documents,
    status,
    error,
    refreshing,
    deletingIds,
    deletingAll,
    refresh,
    removeDocument,
    removeAll,
  };
}
