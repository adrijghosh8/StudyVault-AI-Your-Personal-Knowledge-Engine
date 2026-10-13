# StudyVault AI — Frontend

React + Vite + Tailwind + Framer Motion + Lucide frontend for the StudyVault FastAPI backend.
It talks to your real API only — no mock endpoints, fake answers or placeholder data.

## Run it

```bash
# 1. Start your FastAPI backend from the project root (default http://127.0.0.1:8000)
#    uvicorn backend.main:app --reload

# 2. In this folder
cp .env.example .env        # edit VITE_API_BASE_URL if your backend isn't on 127.0.0.1:8000
npm install
npm run dev                 # http://localhost:5173
```

Production check: `npm run build` then `npm run preview` (http://localhost:4173).

## How requests reach the backend

By default the app calls `/api/*` on the Vite server, which proxies to `VITE_API_BASE_URL`
(see `vite.config.js`). That works with any backend build.

The backend now enables CORS (`CORS_ORIGINS` in its environment, defaulting to
`localhost`/`127.0.0.1` on ports 5173 and 4173). When you deploy the built files elsewhere you can
either keep a reverse proxy that maps `/api` to the backend, or set `VITE_API_DIRECT=true`, add your
site to `CORS_ORIGINS`, and let the browser call the API directly.

## UI action → API function (`src/services/api.js`)

| UI action                         | Function              | Request                              |
| --------------------------------- | --------------------- | ------------------------------------ |
| Connection indicator              | `checkHealth`         | `GET /`                              |
| Send a question                   | `askQuestion`         | `POST /ask` `{"question": "…"}`      |
| Stop a running answer             | (aborts `askQuestion`) | closes the `POST /ask` connection   |
| Upload files / import URLs        | `uploadDocuments`     | `POST /documents/upload` (multipart) |
| Load / refresh knowledge base     | `listDocuments`       | `GET /documents`                     |
| Delete one document               | `deleteDocument`      | `DELETE /documents/{document_id}`    |
| Delete all documents              | `deleteAllDocuments`  | `DELETE /documents`                  |
| Inspect chunks                    | `getDocumentChunks`   | `GET /documents/{document_id}/chunks`|

## Response shapes (`src/utils/responseAdapter.js`)

The adapters are written against what the backend really returns:

- `POST /ask` → `{ question, answer, sources: [{ filename, page_number, chunk_id, source_type, source_url, snippet }] }`
- `GET /documents` → `{ documents: [{ id, filename, source_type, source_url, chunks }] }`
- `GET /documents/{id}/chunks` → `{ document_id, total_chunks, chunks: [{ chunk_id, text, metadata }] }`
- `POST /documents/upload` → `{ total, successful, failed, results: [{ id?, filename?, url?, status, chunks?, error? }] }`

A response that doesn't match is shown as an "unexpected format" error instead of being guessed at.
The backend returns no size, status or date for documents, so the list doesn't show those columns.

## Notes

- Upload counts are derived from the per-item `results[]` (files and URLs), not the backend's `total`.
  An HTTP 200 with failed items is shown as a partial success, and failed items stay in the queue so
  they can be retried.
- **Answer formatting**: answers render Markdown plus LaTeX math (`$…$`, `$$…$$`, `\(…\)`, `\[…\]`) via
  `remark-math` + `rehype-katex`. Inline `[Source: …]` tags are stripped for display
  (`src/utils/answerText.js`), and the source list under answers is no longer shown. Run `npm install`
  after updating, since this adds the `katex`, `rehype-katex` and `remark-math` packages.
- **Resizable assistant**: drag the divider between the panels (xl screens and up). Arrow keys resize it
  when focused, double-click resets it, and the width is remembered in `localStorage`.
- **Stop**: the Stop button aborts the request. The backend watches for the closed connection and
  cancels the model call, so the answer stops being generated.
- **Chat history** is saved in this browser's `localStorage` (last 100 messages) and survives
  reloads. "New conversation" clears it. It is not shared between browsers or devices.
- **Persistence**: the backend keeps indexed documents between restarts by default. If it is started
  with `CLEAR_DATA_ON_SHUTDOWN=true`, `GET /` reports it and the UI says documents are cleared on
  shutdown (Settings and the empty state).
