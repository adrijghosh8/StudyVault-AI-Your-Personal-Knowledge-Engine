// Centralized API layer. Every request to the StudyVault FastAPI backend goes
// through this module, so error handling is consistent and UI components never
// call fetch() directly.
//
// UI action                      -> service function
// Connection indicator           -> checkHealth()            GET    /
// Ask the assistant              -> askQuestion()            POST   /ask
// Upload files / import URLs     -> uploadDocuments()        POST   /documents/upload
// Load / refresh knowledge base  -> listDocuments()          GET    /documents
// Delete one document            -> deleteDocument(id)       DELETE /documents/{id}
// Delete everything              -> deleteAllDocuments()     DELETE /documents
// Inspect chunks                 -> getDocumentChunks(id)    GET    /documents/{id}/chunks

import { ApiError } from '../utils/apiError';
import {
  adaptAnswer,
  adaptChunks,
  adaptDocuments,
  adaptUploadResponse,
} from '../utils/responseAdapter';

/** Backend the proxy (or direct mode) points at. Configured via VITE_API_BASE_URL. */
export const API_TARGET = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(
  /\/+$/,
  '',
);

// By default the browser calls the Vite dev/preview server at /api and Vite forwards to
// API_TARGET (see vite.config.js), which works with any backend build. The backend now also
// ships CORS middleware (CORS_ORIGINS), so a deployed build can set VITE_API_DIRECT=true and
// call the API directly instead.
const DIRECT = import.meta.env.VITE_API_DIRECT === 'true';
const BASE = DIRECT ? API_TARGET : '/api';

const unreachable = (cause) =>
  new ApiError(
    `Can't reach the StudyVault backend at ${API_TARGET}. Make sure it is running, then try again.`,
    { kind: 'network', cause },
  );

function extractDetail(body) {
  if (!body || typeof body !== 'object') return '';
  const detail = body.detail ?? body.message ?? body.error;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d?.msg === 'string' ? d.msg : ''))
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function messageForStatus(status, detail) {
  const d = detail && detail.length <= 240 ? detail : '';
  if (status === 400) return d || 'The request was not valid. Check your input and try again.';
  if (status === 404) return d || 'That item was not found. It may already have been deleted.';
  if (status === 413) return d || 'The file is too large. The maximum size is 200 MB per file.';
  if (status === 422) return d || 'The request could not be processed. Check your input and try again.';
  if (status >= 500) return d || 'The server ran into a problem. Please try again in a moment.';
  return d || `The request failed (HTTP ${status}).`;
}

async function request(path, { method = 'GET', json, signal } = {}) {
  const headers = { Accept: 'application/json' };
  let body;
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let response;
  try {
    response = await fetch(`${BASE}${path}`, { method, headers, body, signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw unreachable(err);
  }

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    // The dev proxy answers with an empty 5xx when the backend is down.
    if (response.status >= 500 && data === null) throw unreachable();
    throw new ApiError(messageForStatus(response.status, extractDetail(data)), {
      status: response.status,
      kind: 'http',
    });
  }

  if (data === null) {
    throw new ApiError('The backend returned an empty or unreadable response.', {
      status: response.status,
      kind: 'malformed',
    });
  }
  return data;
}

/** GET / */
export async function checkHealth(signal) {
  const data = await request('/', { signal });
  return {
    healthy: data?.status === 'healthy',
    application: data?.application,
    // Only present on newer backends; undefined means "unknown".
    clearsOnShutdown:
      typeof data?.clears_data_on_shutdown === 'boolean' ? data.clears_data_on_shutdown : undefined,
  };
}

/** POST /ask  body: {"question": string} */
export async function askQuestion(question, signal) {
  const data = await request('/ask', { method: 'POST', json: { question }, signal });
  return adaptAnswer(data);
}

/** GET /documents */
export async function listDocuments(signal) {
  const data = await request('/documents', { signal });
  return adaptDocuments(data);
}

/** DELETE /documents/{document_id} */
export function deleteDocument(documentId) {
  return request(`/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' });
}

/** DELETE /documents */
export function deleteAllDocuments() {
  return request('/documents', { method: 'DELETE' });
}

/** GET /documents/{document_id}/chunks */
export async function getDocumentChunks(documentId, signal) {
  const data = await request(`/documents/${encodeURIComponent(documentId)}/chunks`, { signal });
  return adaptChunks(data);
}

/**
 * POST /documents/upload  (multipart/form-data: repeated `files` and `urls` fields)
 *
 * Uses XMLHttpRequest so byte-level upload progress is measurable. The browser
 * sets the multipart Content-Type (with boundary) itself. The backend ingests
 * everything inside this single request, so once the bytes are sent the only
 * thing the client can honestly report is "waiting for processing".
 */
export function uploadDocuments({ files = [], urls = [] }, { onProgress, onUploaded, signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }

    const form = new FormData();
    files.forEach((file) => form.append('files', file, file.name));
    urls.forEach((url) => form.append('urls', url));

    const xhr = new XMLHttpRequest();
    const onAbort = () => xhr.abort();
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    signal?.addEventListener('abort', onAbort, { once: true });

    xhr.open('POST', `${BASE}/documents/upload`);
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress?.(event.loaded / event.total);
    };
    xhr.upload.onload = () => {
      onProgress?.(1);
      onUploaded?.();
    };

    xhr.onload = () => {
      cleanup();
      let data = null;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        data = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (data === null) {
          reject(
            new ApiError('The backend returned an empty or unreadable response.', {
              status: xhr.status,
              kind: 'malformed',
            }),
          );
          return;
        }
        try {
          resolve(adaptUploadResponse(data));
        } catch (err) {
          reject(err);
        }
        return;
      }

      if (xhr.status >= 500 && data === null) {
        reject(unreachable());
        return;
      }
      reject(
        new ApiError(messageForStatus(xhr.status, extractDetail(data)), {
          status: xhr.status,
          kind: 'http',
        }),
      );
    };

    xhr.onerror = () => {
      cleanup();
      reject(unreachable());
    };
    xhr.onabort = () => {
      cleanup();
      reject(new DOMException('Aborted', 'AbortError'));
    };

    xhr.send(form);
  });
}
