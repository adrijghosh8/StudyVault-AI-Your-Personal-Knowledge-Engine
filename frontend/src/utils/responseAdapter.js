// Adapters for the StudyVault backend's real response shapes (see backend/main.py,
// rag/generator.py and rag/vector_store.py):
//
//   POST /ask                  -> { question, answer, sources: [{ filename, page_number, chunk_id,
//                                   source_type, source_url, snippet }] }
//   GET  /documents            -> { documents: [{ id, filename, source_type, source_url, chunks }] }
//   GET  /documents/{id}/chunks-> { document_id, total_chunks, chunks: [{ chunk_id, text, metadata }] }
//   POST /documents/upload     -> { total, successful, failed, results: [{ id?, filename?, url?,
//                                   status, chunks?, error? }] }
//
// Anything that does not match is reported as a "malformed" error instead of being guessed at.
// Optional fields (source_url, snippet, page_number...) are simply absent when the backend omits
// them, so the UI also works with an older backend build.

import { ApiError } from './apiError';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isText = (v) => typeof v === 'string' && v.trim().length > 0;
const malformed = (message) => new ApiError(message, { kind: 'malformed' });

/* ------------------------------------------------------------------ */
/* POST /ask                                                           */
/* ------------------------------------------------------------------ */

function normalizeSource(item, index) {
  if (!isObj(item)) return null;

  const title = [item.filename, item.source_url].find(isText);
  const page = Number.isFinite(item.page_number) ? String(item.page_number) : undefined;

  return {
    id: isText(item.chunk_id) ? item.chunk_id : `src-${index}`,
    title: title || 'Unknown source',
    page,
    snippet: isText(item.snippet) ? item.snippet : undefined,
    url: isText(item.source_url) ? item.source_url : undefined,
  };
}

export function adaptAnswer(data) {
  if (!isObj(data) || typeof data.answer !== 'string') {
    throw malformed('The assistant returned a response in an unexpected format.');
  }
  if (!data.answer.trim()) {
    throw malformed('The assistant returned an empty answer. Try rephrasing your question.');
  }

  const sources = [];
  const seen = new Set();
  (Array.isArray(data.sources) ? data.sources : []).forEach((item, index) => {
    const source = normalizeSource(item, index);
    if (!source || seen.has(source.id)) return;
    seen.add(source.id);
    sources.push(source);
  });

  return { text: data.answer, sources };
}

/* ------------------------------------------------------------------ */
/* GET /documents                                                      */
/* ------------------------------------------------------------------ */

// backend source_type -> label shown in the Type column.
const TYPE_LABELS = { pdf: 'PDF', text: 'TXT', web: 'Web' };

function typeLabelFor(sourceType, filename) {
  if (TYPE_LABELS[sourceType]) return TYPE_LABELS[sourceType];
  // Images are stored as source_type "image"; show the real format (PNG/JPG/...).
  const dot = filename ? filename.lastIndexOf('.') : -1;
  if (dot > -1 && dot < filename.length - 1) return filename.slice(dot + 1).toUpperCase();
  return sourceType === 'image' ? 'Image' : '';
}

function normalizeDocument(item) {
  if (!isObj(item) || !isText(item.id)) return null;

  const sourceUrl = isText(item.source_url) ? item.source_url : undefined;
  const name = isText(item.filename) ? item.filename : sourceUrl || item.id;
  const isWeb = item.source_type === 'web' || Boolean(sourceUrl);

  return {
    key: `doc-${item.id}`,
    id: item.id,
    name,
    sourceUrl,
    isWeb,
    isImage: item.source_type === 'image',
    typeLabel: isWeb ? 'Web' : typeLabelFor(item.source_type, item.filename),
    chunks: Number.isFinite(item.chunks) ? item.chunks : undefined,
  };
}

export function adaptDocuments(data) {
  if (!isObj(data) || !Array.isArray(data.documents)) {
    throw malformed('The document list came back in an unexpected format.');
  }
  const seen = new Set();
  const out = [];
  data.documents.forEach((item) => {
    const doc = normalizeDocument(item);
    if (!doc || seen.has(doc.id)) return;
    seen.add(doc.id);
    out.push(doc);
  });
  return out;
}

/* ------------------------------------------------------------------ */
/* GET /documents/{id}/chunks                                          */
/* ------------------------------------------------------------------ */

function stringifyMeta(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

// Shown in the chunk header already (or repeated on every chunk), so skipped in the metadata list.
const HIDDEN_CHUNK_META = new Set(['chunk_id', 'document_id']);

function normalizeChunk(item, index) {
  if (!isObj(item)) return null;

  const meta = isObj(item.metadata) ? item.metadata : {};
  const metadata = Object.entries(meta)
    .filter(([k]) => !HIDDEN_CHUNK_META.has(k))
    .map(([k, v]) => [k, stringifyMeta(v)])
    .filter(([, v]) => v !== '');

  return {
    key: isText(item.chunk_id) ? item.chunk_id : `chunk-${index}`,
    id: isText(item.chunk_id) ? item.chunk_id : undefined,
    text: typeof item.text === 'string' ? item.text : '',
    page: Number.isFinite(meta.page_number) ? meta.page_number : undefined,
    metadata,
  };
}

export function adaptChunks(data) {
  if (!isObj(data) || !Array.isArray(data.chunks)) {
    throw malformed('The chunk data came back in an unexpected format.');
  }
  const chunks = data.chunks.map(normalizeChunk).filter(Boolean);
  return {
    documentId: isText(data.document_id) ? data.document_id : undefined,
    total: Number.isFinite(data.total_chunks) ? data.total_chunks : chunks.length,
    chunks,
  };
}

/* ------------------------------------------------------------------ */
/* POST /documents/upload                                              */
/* ------------------------------------------------------------------ */

export function adaptUploadResponse(data) {
  if (!isObj(data) || !Array.isArray(data.results)) {
    throw malformed('The upload response came back in an unexpected format.');
  }

  const results = data.results.filter(isObj).map((r) => ({
    id: isText(r.id) ? r.id : undefined,
    filename: typeof r.filename === 'string' ? r.filename : undefined,
    url: typeof r.url === 'string' ? r.url : undefined,
    name: r.filename || r.url || 'Unknown item',
    status: r.status === 'success' ? 'success' : 'failed',
    chunks: Number.isFinite(r.chunks) ? r.chunks : undefined,
    error: typeof r.error === 'string' ? r.error : undefined,
  }));

  // Everything is derived from the per-item results. The backend's own `total` only counted
  // files (not URLs) in older builds, so it is deliberately not trusted here.
  const successful = results.filter((r) => r.status === 'success').length;
  return {
    total: results.length,
    successful,
    failed: results.length - successful,
    results,
  };
}
