import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Button from './Button';
import { useToast } from './Toast';
import { copyText } from '../../utils/clipboard';

export default function CopyButton({ text, label = 'Copy', className }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onClick = async (event) => {
    event.stopPropagation();
    const ok = await copyText(text);
    if (!ok) {
      toast.error('Could not copy to the clipboard.');
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={copied ? 'Copied' : label}
      title={copied ? 'Copied' : label}
      onClick={onClick}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4 text-ok" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  );
}
