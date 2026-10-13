import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import ChatComposer from './ChatComposer';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import Button from '../ui/Button';
import StatusDot, { STATUS_LABELS } from '../ui/StatusDot';
import { askQuestion } from '../../services/api';
import { isAbort, toMessage } from '../../utils/apiError';

// Generic prompts that make no claims about what the user's documents contain.
const STORAGE_KEY = 'studyvault.chat.v1';
const MAX_STORED_MESSAGES = 100;

// Chat history is kept in this browser's localStorage so it survives reloads. Error and
// "stopped" notices are transient and are never saved.
function loadMessages() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  try {
    const keep = messages.filter((m) => !m.error && !m.stopped).slice(-MAX_STORED_MESSAGES);
    if (keep.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keep));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be full or blocked (private mode); the chat still works for this session.
  }
}

const SUGGESTIONS = [
  'Summarize the main points of my documents',
  'What topics do my documents cover?',
  'Create practice questions from my notes',
  'Explain the key concepts in simple terms',
];

export default function AssistantPanel({ health, docCount, docsLoaded, focusSignal, onGoToKnowledge }) {
  const [messages, setMessages] = useState(loadMessages);
  const [pending, setPending] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const idRef = useRef(messages.reduce((max, m) => Math.max(max, Number(m.id) || 0), 0));
  const pendingRef = useRef(false);
  const controllerRef = useRef(null);
  const mountedRef = useRef(true);
  const lastQuestionRef = useRef('');
  const reduceMotion = useReducedMotion();

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (focusSignal) inputRef.current?.focus();
  }, [focusSignal]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [messages, pending, reduceMotion]);

  const send = useCallback(async (raw, { retry = false } = {}) => {
    const question = raw.trim();
    if (!question || pendingRef.current) return;

    pendingRef.current = true;
    lastQuestionRef.current = question;
    setPending(true);
    if (!retry) {
      setMessages((m) => [...m, { id: nextId(), role: 'user', content: question, createdAt: new Date() }]);
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const answer = await askQuestion(question, controller.signal);
      if (controller.signal.aborted) return;
      setMessages((m) => [
        ...m,
        { id: nextId(), role: 'assistant', content: answer.text, createdAt: new Date() },
      ]);
    } catch (err) {
      if (isAbort(err)) return;
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'assistant',
          error: true,
          question,
          content: toMessage(err, 'The assistant could not answer. Please try again.'),
          createdAt: new Date(),
        },
      ]);
    } finally {
      pendingRef.current = false;
      if (mountedRef.current) setPending(false);
    }
  }, []);

  // Stop cancels the browser request. The backend notices the closed connection and cancels
  // the model call too, so nothing keeps running for an answer nobody will read.
  const stop = useCallback(() => {
    const controller = controllerRef.current;
    if (!pendingRef.current || !controller || controller.signal.aborted) return;
    const question = lastQuestionRef.current;
    controller.abort();
    setMessages((m) => [
      ...m,
      { id: nextId(), role: 'assistant', stopped: true, question, content: '', createdAt: new Date() },
    ]);
  }, []);

  const retry = useCallback(
    (message) => {
      setMessages((m) => m.filter((x) => x.id !== message.id));
      send(message.question, { retry: true });
    },
    [send],
  );

  const newChat = () => {
    if (pendingRef.current) return;
    setMessages([]);
    inputRef.current?.focus();
  };

  const noDocs = docsLoaded && docCount === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white" aria-hidden="true">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink">AI Assistant</h2>
            <p className="flex items-center gap-1.5 text-xs text-soft" aria-live="polite">
              <StatusDot status={health.status} />
              API {STATUS_LABELS[health.status].toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Start a new conversation"
          title="New conversation"
          disabled={messages.length === 0 || pending}
          onClick={newChat}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !pending ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-elevated text-accent" aria-hidden="true">
              <Sparkles className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-medium text-ink">Ask about your documents</h3>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-soft">
              {noDocs
                ? 'The assistant works best once relevant knowledge has been indexed. Upload a document or import a web page first.'
                : 'Answers are generated from the knowledge you’ve indexed.'}
            </p>
            {noDocs && (
              <Button className="mt-3 xl:hidden" onClick={onGoToKnowledge}>
                Go to Knowledge Base
              </Button>
            )}
            <ul className="mt-5 flex w-full max-w-xs flex-col gap-2" aria-label="Suggested questions">
              {SUGGESTIONS.map((text) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() => send(text)}
                    className="w-full rounded-xl border border-line bg-panel px-3 py-2 text-left text-xs text-soft transition-colors hover:border-[#3a3a3a] hover:bg-elevated hover:text-ink"
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="flex flex-col gap-4" aria-label="Conversation">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} onRetry={retry} retryDisabled={pending} />
            ))}
            {pending && (
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-elevated text-accent" aria-hidden="true">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <div className="rounded-2xl rounded-tl-md border border-line bg-elevated px-3.5 py-2.5">
                  <TypingIndicator />
                </div>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="border-t border-line px-4 pb-3 pt-3">
        {health.status === 'disconnected' && (
          <p role="status" className="mb-2 rounded-lg border border-err/30 bg-err/10 px-3 py-1.5 text-xs text-[#e49795]">
            The backend isn’t reachable right now. Questions will fail until it’s back.
          </p>
        )}
        <ChatComposer ref={inputRef} onSend={send} onStop={stop} pending={pending} />
        <p className="mt-2 text-center text-[11px] text-mute">
          AI can make mistakes. Verify important information. This conversation is saved only in this browser; start a new
          conversation to clear it.
        </p>
      </div>
    </div>
  );
}
