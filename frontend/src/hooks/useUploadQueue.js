import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadDocuments } from '../services/api';
import { isAbort, toMessage } from '../utils/apiError';
import { useToast } from '../components/ui/Toast';
import {
  fileKey,
  isValidHttpUrl,
  splitUrlInput,
  urlKey,
  validateFile,
} from '../utils/fileValidation';
import { pluralize } from '../utils/format';

const BUSY_PHASES = new Set(['preparing', 'uploading', 'processing']);

/**
 * Upload queue for files and URLs. Phases reflect what the client can actually
 * observe: preparing -> uploading (measured bytes) -> processing (the backend
 * indexes inside the same request, so only "waiting" is knowable) -> done/failed.
 */
export function useUploadQueue({ onFinished }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [phase, setPhase] = useState('idle'); // idle | preparing | uploading | processing | done | failed
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [requestError, setRequestError] = useState(null);

  const itemsRef = useRef([]);
  const busyRef = useRef(false);
  const controllerRef = useRef(null);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const commit = useCallback((next) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const addFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length || busyRef.current) return { added: 0, duplicates: 0, invalid: 0 };

      const existing = new Set(itemsRef.current.map((i) => i.key));
      const additions = [];
      let duplicates = 0;
      let invalid = 0;

      files.forEach((file) => {
        const key = fileKey(file);
        if (existing.has(key)) {
          duplicates += 1;
          return;
        }
        existing.add(key);
        const error = validateFile(file);
        if (error) invalid += 1;
        additions.push({ key, kind: 'file', file, name: file.name, size: file.size, error });
      });

      if (additions.length) commit([...itemsRef.current, ...additions]);
      if (duplicates) toast.info(`${pluralize(duplicates, 'duplicate file')} skipped.`);
      return { added: additions.length - invalid, duplicates, invalid };
    },
    [commit, toast],
  );

  /** Accepts one or several URLs (separated by spaces, commas or new lines). */
  const addUrls = useCallback(
    (text) => {
      const tokens = splitUrlInput(text);
      if (busyRef.current) return { added: 0, duplicates: 0, rejected: tokens };

      const existing = new Set(itemsRef.current.map((i) => i.key));
      const additions = [];
      const rejected = [];
      let duplicates = 0;

      tokens.forEach((url) => {
        if (!isValidHttpUrl(url)) {
          rejected.push(url);
          return;
        }
        const key = urlKey(url);
        if (existing.has(key)) {
          duplicates += 1;
          return;
        }
        existing.add(key);
        additions.push({ key, kind: 'url', url, name: url });
      });

      if (additions.length) commit([...itemsRef.current, ...additions]);
      return { added: additions.length, duplicates, rejected };
    },
    [commit],
  );

  const removeItem = useCallback(
    (key) => {
      if (busyRef.current) return;
      commit(itemsRef.current.filter((i) => i.key !== key));
    },
    [commit],
  );

  const clear = useCallback(() => {
    if (busyRef.current) return;
    commit([]);
    setRequestError(null);
    setResult(null);
    setPhase('idle');
  }, [commit]);

  const dismissResult = useCallback(() => {
    setResult(null);
    setPhase((p) => (BUSY_PHASES.has(p) ? p : 'idle'));
  }, []);

  const submit = useCallback(async () => {
    if (busyRef.current) return;
    const sendable = itemsRef.current.filter((i) => !i.error);
    if (!sendable.length) return;

    busyRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    setResult(null);
    setRequestError(null);
    setProgress(0);
    setPhase('preparing');
    // Clear errors from a previous attempt so the queue reflects the new run.
    commit(itemsRef.current.map(({ serverError, ...rest }) => rest));

    try {
      const files = sendable.filter((i) => i.kind === 'file').map((i) => i.file);
      const urls = sendable.filter((i) => i.kind === 'url').map((i) => i.url);

      // Let the "preparing" state paint once before the request starts.
      await new Promise((resolve) => requestAnimationFrame(resolve));
      setPhase('uploading');

      const data = await uploadDocuments(
        { files, urls },
        {
          signal: controller.signal,
          onProgress: setProgress,
          onUploaded: () => setPhase('processing'),
        },
      );

      // Reconcile the queue against the per-item results (HTTP 200 does not mean every item succeeded).
      const matched = new Set();
      const outcomes = new Map();
      data.results.forEach((r) => {
        const item = sendable.find(
          (i) =>
            !matched.has(i.key) &&
            (r.url ? i.kind === 'url' && i.url === r.url : i.kind === 'file' && i.name === r.filename),
        );
        if (!item) return;
        matched.add(item.key);
        outcomes.set(item.key, r);
      });

      commit(
        itemsRef.current
          .filter((i) => outcomes.get(i.key)?.status !== 'success')
          .map((i) =>
            outcomes.get(i.key)?.status === 'failed'
              ? { ...i, serverError: outcomes.get(i.key).error || 'Upload failed.' }
              : i,
          ),
      );

      setResult(data);
      setPhase(data.successful === 0 && data.failed > 0 ? 'failed' : 'done');

      if (data.failed === 0) {
        toast.success(`${pluralize(data.successful, 'item')} added to your knowledge base.`);
      } else if (data.successful === 0) {
        toast.error(`${pluralize(data.failed, 'item')} could not be added.`);
      } else {
        toast.warning(`${data.successful} added, ${data.failed} failed. See details below.`);
      }

      await onFinishedRef.current?.();
    } catch (err) {
      if (isAbort(err)) {
        setPhase('idle');
      } else {
        const message = toMessage(err, 'The upload failed. Please try again.');
        setRequestError(message);
        setPhase('failed');
        toast.error(message);
      }
    } finally {
      busyRef.current = false;
    }
  }, [commit, toast]);

  const readyCount = items.filter((i) => !i.error).length;
  const invalidCount = items.length - readyCount;

  return {
    items,
    phase,
    progress,
    result,
    requestError,
    busy: BUSY_PHASES.has(phase),
    readyCount,
    invalidCount,
    addFiles,
    addUrls,
    removeItem,
    clear,
    dismissResult,
    submit,
  };
}
