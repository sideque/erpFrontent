import { Loader2 } from 'lucide-react';

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin text-ink-500" />;
}

export function PageLoader() {
  return (
    <div className="grid place-items-center py-20 text-ink-500">
      <Spinner size={28} />
    </div>
  );
}
