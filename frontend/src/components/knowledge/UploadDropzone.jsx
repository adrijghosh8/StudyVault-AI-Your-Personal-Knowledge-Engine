import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';
import { ACCEPT_ATTR, MAX_FILE_SIZE_MB } from '../../utils/fileValidation';
import { cn } from '../../utils/cn';

const UploadDropzone = forwardRef(function UploadDropzone({ onFiles, disabled }, ref) {
  const inputRef = useRef(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  useImperativeHandle(ref, () => ({ open: () => inputRef.current?.click() }), []);

  const hasFiles = (event) => Array.from(event.dataTransfer?.types || []).includes('Files');

  const onDragEnter = (event) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    dragDepth.current += 1;
    setDragging(true);
  };
  const onDragOver = (event) => {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (event) => {
    if (disabled) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragging(false);
  };
  const onDrop = (event) => {
    if (disabled) return;
    event.preventDefault();
    dragDepth.current = 0;
    setDragging(false);
    if (event.dataTransfer?.files?.length) onFiles(event.dataTransfer.files);
  };

  return (
    <motion.div
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      animate={{
        borderColor: dragging ? '#3478F6' : '#303030',
        backgroundColor: dragging ? 'rgba(52,120,246,0.08)' : 'rgba(16,16,16,1)',
      }}
      transition={{ duration: 0.15 }}
      className="relative rounded-xl border border-dashed"
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex w-full flex-col items-center justify-center gap-2 rounded-xl px-4 py-7 text-center transition-colors',
          'enabled:hover:bg-white/[0.02] disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border bg-elevated transition-colors',
            dragging ? 'animate-pulse border-accent text-accent' : 'border-line text-soft',
          )}
        >
          <Upload className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium text-ink">
          {dragging ? 'Drop to add to the queue' : 'Click to upload or drag and drop'}
        </span>
        <span className="text-xs text-mute">
          PDF, TXT, PNG, JPG or JPEG · max {MAX_FILE_SIZE_MB} MB per file
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose files to upload"
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = '';
        }}
      />
    </motion.div>
  );
});

export default UploadDropzone;
