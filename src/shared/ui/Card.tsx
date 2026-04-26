import { cn } from '../lib/format';
import { ReactNode } from 'react';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('card p-5', className)}>{children}</div>;
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="flex items-start gap-3">
        {icon && <div className="text-ink-700 mt-0.5">{icon}</div>}
        <div>
          <h2 className="text-base font-semibold text-ink-900">{title}</h2>
          {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
