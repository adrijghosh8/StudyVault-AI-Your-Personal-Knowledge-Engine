import { useId, useState } from 'react';
import { Link2, Plus } from 'lucide-react';
import Button from '../ui/Button';

export default function UrlImporter({ onAdd, disabled }) {
  const inputId = useId();
  const [value, setValue] = useState('');
  const [message, setMessage] = useState(null);

  const submit = () => {
    if (!value.trim()) return;
    const { added, duplicates, rejected } = onAdd(value);

    if (rejected.length) {
      const first = rejected[0].length > 48 ? `${rejected[0].slice(0, 48)}…` : rejected[0];
      setMessage({
        tone: 'error',
        text:
          rejected.length === 1
            ? `“${first}” isn’t a valid HTTP or HTTPS URL.`
            : `${rejected.length} entries aren’t valid HTTP or HTTPS URLs.`,
      });
      // Keep only the entries that still need fixing.
      setValue(rejected.join(' '));
      return;
    }

    setValue('');
    setMessage(
      duplicates && !added
        ? { tone: 'info', text: 'That URL is already in the queue.' }
        : null,
    );
  };

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        Import from URL
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute"
            aria-hidden="true"
          />
          <input
            id={inputId}
            type="text"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              setValue(e.target.value);
              if (message) setMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Import from a URL — https://example.com/article"
            aria-invalid={message?.tone === 'error' || undefined}
            aria-describedby={message ? `${inputId}-msg` : undefined}
            className="h-9 w-full rounded-lg border border-line bg-panel pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-mute focus:border-[#4a4a4a] disabled:opacity-60 aria-[invalid=true]:border-err/60"
          />
        </div>
        <Button icon={Plus} onClick={submit} disabled={disabled || !value.trim()}>
          Add URL
        </Button>
      </div>
      <p
        id={`${inputId}-msg`}
        role={message?.tone === 'error' ? 'alert' : undefined}
        className={`mt-1.5 min-h-[1rem] text-xs ${message?.tone === 'error' ? 'text-[#e49795]' : 'text-mute'}`}
      >
        {message?.text ?? 'HTTP and HTTPS only. Paste several URLs separated by spaces or new lines.'}
      </p>
    </div>
  );
}
