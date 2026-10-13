import { forwardRef, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Send, Square } from 'lucide-react';
import Button from '../ui/Button';

const MAX_HEIGHT = 160;

const ChatComposer = forwardRef(function ChatComposer({ onSend, onStop, pending }, ref) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !pending;

  // Grow the textarea with its content, up to a cap.
  useLayoutEffect(() => {
    const el = ref?.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value, ref]);

  // The textarea is disabled while a request runs; hand focus back only when one finishes.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) ref?.current?.focus({ preventScroll: true });
    wasPending.current = pending;
  }, [pending, ref]);

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-2xl border border-line bg-panel p-2 transition-colors focus-within:border-[#4a4a4a]"
    >
      <label htmlFor="chat-input" className="sr-only">
        Ask a question about your documents
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Ask a question about your documents…"
        className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-relaxed text-ink outline-none placeholder:text-mute disabled:opacity-60 focus-visible:outline-none"
      />
      {pending ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label="Stop generating"
          title="Stop generating"
          onClick={onStop}
          className="mb-0.5 h-8 w-8 rounded-lg"
        >
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        </Button>
      ) : (
        <Button
          type="submit"
          variant="primary"
          size="icon"
          aria-label="Send question"
          disabled={!canSend}
          className="mb-0.5 h-8 w-8 rounded-lg"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </form>
  );
});

export default ChatComposer;
