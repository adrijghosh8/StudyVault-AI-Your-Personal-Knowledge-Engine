import { useEffect, useId, useState } from 'react';
import Dialog from './Dialog';
import Button from './Button';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  requireText,
  onConfirm,
  onCancel,
  children,
}) {
  const [typed, setTyped] = useState('');
  const inputId = useId();

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const canConfirm = !requireText || typed.trim() === requireText;

  const submit = () => {
    if (loading || !canConfirm) return;
    onConfirm?.();
  };

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            data-autofocus={requireText ? undefined : ''}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger-solid' : 'primary'}
            loading={loading}
            disabled={!canConfirm}
            onClick={submit}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
      {requireText && (
        <div className="mt-3">
          <label htmlFor={inputId} className="text-xs text-soft">
            Type <span className="font-mono text-ink">{requireText}</span> to confirm
          </label>
          <input
            id={inputId}
            data-autofocus=""
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submit();
              }
            }}
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 h-9 w-full rounded-lg border border-line bg-bg px-3 font-mono text-sm text-ink outline-none transition-colors focus:border-[#4a4a4a]"
          />
        </div>
      )}
    </Dialog>
  );
}
