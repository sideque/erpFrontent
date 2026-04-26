import { ReactNode } from 'react';
import { cn } from '../lib/format';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  width?: string;
}

export function Table<T extends { _id?: string; id?: string }>({
  columns,
  rows,
  empty,
  loading,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  empty?: ReactNode;
  loading?: boolean;
  onRowClick?: (r: T) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50/70 border-b border-line">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={cn('px-5 py-3 text-left table-header', c.className)}
                  style={c.width ? { width: c.width } : undefined}
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-10 text-center text-ink-500">Loading…</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-5 py-12 text-center text-ink-500">
                  {empty || 'No records found.'}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={(row as any)._id || (row as any).id}
                onClick={() => onRowClick?.(row)}
                className={cn('text-sm text-ink-800 hover:bg-slate-50/60', onRowClick && 'cursor-pointer')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-5 py-3.5 align-middle', c.className)}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
