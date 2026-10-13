export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[i]}`;
}

export function formatTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
  } catch {
    return '';
  }
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
