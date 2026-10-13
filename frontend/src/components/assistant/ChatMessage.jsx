import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion } from 'framer-motion';
import { AlertCircle, Ban, RotateCcw, Sparkles } from 'lucide-react';
import Button from '../ui/Button';
import CopyButton from '../ui/CopyButton';
import { formatTime } from '../../utils/format';
import { prepareAnswer } from '../../utils/answerText';

const remarkPlugins = [remarkGfm, remarkMath];
const rehypePlugins = [rehypeKatex];

const markdownComponents = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

function Avatar() {
  return (
    <span
      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-elevated text-accent"
      aria-hidden="true"
    >
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

function ChatMessage({ message, onRetry, retryDisabled }) {
  const time = formatTime(message.createdAt);
  const text = useMemo(
    () => (message.role === 'assistant' && !message.error && !message.stopped ? prepareAnswer(message.content) : ''),
    [message],
  );
  const enter = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2 } };

  if (message.role === 'user') {
    return (
      <motion.li {...enter} className="flex flex-col items-end gap-1">
        <div className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-accent px-3.5 py-2.5 text-sm leading-relaxed text-white">
          {message.content}
        </div>
        <span className="px-1 text-[11px] text-mute">{time}</span>
      </motion.li>
    );
  }

  if (message.stopped) {
    return (
      <motion.li {...enter} className="flex gap-2.5">
        <Avatar />
        <div className="min-w-0 max-w-[92%]">
          <div className="rounded-2xl rounded-tl-md border border-dashed border-line px-3.5 py-2.5">
            <p className="flex items-center gap-2 text-sm text-soft">
              <Ban className="h-4 w-4 shrink-0" aria-hidden="true" />
              You stopped this answer.
            </p>
            <Button
              size="sm"
              variant="secondary"
              icon={RotateCcw}
              className="mt-2.5"
              disabled={retryDisabled}
              onClick={() => onRetry(message)}
            >
              Ask again
            </Button>
          </div>
        </div>
      </motion.li>
    );
  }

  if (message.error) {
    return (
      <motion.li {...enter} className="flex gap-2.5">
        <Avatar />
        <div className="min-w-0 max-w-[92%]">
          <div role="alert" className="rounded-2xl rounded-tl-md border border-err/40 bg-err/10 px-3.5 py-2.5">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-[#eba9a7]">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {message.content}
            </p>
            <Button
              size="sm"
              variant="secondary"
              icon={RotateCcw}
              className="mt-2.5"
              disabled={retryDisabled}
              onClick={() => onRetry(message)}
            >
              Retry
            </Button>
          </div>
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li {...enter} className="group flex gap-2.5">
      <Avatar />
      <div className="min-w-0 max-w-[92%]">
        <div className="rounded-2xl rounded-tl-md border border-line bg-elevated px-3.5 py-2.5">
          <div className="md">
            <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        </div>
        <div className="mt-1 flex items-center gap-1 px-1">
          <span className="text-[11px] text-mute">{time}</span>
          <CopyButton
            text={text}
            label="Copy answer"
            className="!h-6 !w-6 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          />
        </div>
      </div>
    </motion.li>
  );
}

export default memo(ChatMessage);
