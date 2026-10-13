export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'unknown', cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    // 'network' | 'http' | 'malformed' | 'unknown'
    this.kind = kind;
    if (cause) this.cause = cause;
  }
}

export const toMessage = (err, fallback = 'Something went wrong. Please try again.') =>
  err instanceof ApiError ? err.message : fallback;

export const isAbort = (err) => err?.name === 'AbortError';
