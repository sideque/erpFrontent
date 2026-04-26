import { ReactNode } from 'react';
import { ChevronRight, Search, Bell } from 'lucide-react';

export function PageHeader({
  title,
  breadcrumbs,
  actions,
}: {
  title: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center text-sm text-ink-500 mb-1">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="inline-flex items-center">
                {i > 0 && <ChevronRight size={14} className="mx-1 text-ink-400" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-ink-700 font-medium' : ''}>{b.label}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-10 w-10 grid place-items-center rounded-xl border border-line bg-white text-ink-600 hover:text-ink-900">
          <Search size={18} />
        </button>
        <button className="h-10 w-10 grid place-items-center rounded-xl border border-line bg-white text-ink-600 hover:text-ink-900">
          <Bell size={18} />
        </button>
        {actions}
      </div>
    </div>
  );
}
