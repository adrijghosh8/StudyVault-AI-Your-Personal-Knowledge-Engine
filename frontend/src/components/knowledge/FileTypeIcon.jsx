import { FileText, Globe, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export default function FileTypeIcon({ doc, className }) {
  const Icon = doc.isWeb ? Globe : doc.isImage ? ImageIcon : FileText;
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-soft',
        className,
      )}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}
