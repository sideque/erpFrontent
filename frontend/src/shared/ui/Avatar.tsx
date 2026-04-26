import { initials, cn } from '../lib/format';

export function Avatar({
  src,
  name,
  size = 36,
  className,
}: {
  src?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={cn('rounded-full object-cover ring-2 ring-white', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700 font-bold flex items-center justify-center ring-2 ring-white',
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {initials(name)}
    </div>
  );
}
