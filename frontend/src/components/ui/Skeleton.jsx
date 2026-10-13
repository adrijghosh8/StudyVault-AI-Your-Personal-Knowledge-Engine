import { cn } from '../../utils/cn';

export default function Skeleton({ className }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-md bg-[linear-gradient(90deg,#151515_0%,#202020_50%,#151515_100%)] bg-[length:800px_100%]',
        className,
      )}
    />
  );
}
