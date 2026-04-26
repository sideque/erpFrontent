import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@shared/lib/format';

export function KpiCard({
  label,
  value,
  hint,
  delta,
  icon,
  tone = 'brand',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: number;
  icon?: ReactNode;
  tone?: 'brand' | 'green' | 'amber' | 'rose';
}) {
  const toneBg: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</div>
          <div className="mt-2 text-2xl font-bold text-ink-900 tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
        </div>
        {icon && <div className={cn('h-10 w-10 grid place-items-center rounded-xl', toneBg[tone])}>{icon}</div>}
      </div>
      {typeof delta === 'number' && (
        <div
          className={cn(
            'mt-3 inline-flex items-center gap-1 text-xs font-semibold',
            delta >= 0 ? 'text-emerald-600' : 'text-rose-600'
          )}
        >
          {delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(delta).toFixed(1)}%
          <span className="text-ink-400 font-normal">vs last month</span>
        </div>
      )}
    </div>
  );
}
