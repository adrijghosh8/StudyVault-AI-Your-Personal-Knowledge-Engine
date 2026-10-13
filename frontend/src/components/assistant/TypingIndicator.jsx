import { motion, useReducedMotion } from 'framer-motion';

/** Three softly pulsing dots plus a faint sweeping line, shown only while /ask is in flight. */
export default function TypingIndicator() {
  const reduce = useReducedMotion();
  return (
    <div role="status" aria-label="The assistant is thinking" className="flex flex-col gap-2 py-1">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-soft"
            animate={reduce ? { opacity: 0.7 } : { opacity: [0.25, 1, 0.25], y: [0, -2, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <div className="relative h-px w-24 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="absolute inset-y-0 left-0 w-1/3 animate-indeterminate rounded-full bg-accent/70" />
      </div>
    </div>
  );
}
