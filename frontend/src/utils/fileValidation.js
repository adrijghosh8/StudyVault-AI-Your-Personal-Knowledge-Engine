import { formatBytes } from './format';

export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.png', '.jpg', '.jpeg'];
export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(',');
export const MAX_FILE_SIZE_MB = 200;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export function getExtension(name = '') {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

export const fileKey = (file) => `file:${file.name}:${file.size}:${file.lastModified}`;
export const urlKey = (url) => `url:${url}`;

/** Returns an error string, or null when the file is acceptable. The backend stays authoritative. */
export function validateFile(file) {
  const ext = getExtension(file.name);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Unsupported type. Use PDF, TXT, PNG, JPG or JPEG.';
  }
  if (file.size === 0) return 'This file is empty.';
  if (file.size > MAX_FILE_SIZE) {
    return `Larger than ${MAX_FILE_SIZE_MB} MB (${formatBytes(file.size)}).`;
  }
  return null;
}

export function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/** Splits pasted text on whitespace/commas so several URLs can be entered at once. */
export function splitUrlInput(text = '') {
  return text
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}
