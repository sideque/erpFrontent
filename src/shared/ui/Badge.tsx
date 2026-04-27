import { cn } from '../lib/format';

type Tone = 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'purple';

const map: Record<Tone, string> = {
  green: 'badge-green',
  red: 'badge-red',
  amber: 'badge-amber',
  blue: 'badge-blue',
  gray: 'badge-gray',
  purple: 'badge-purple',
};

export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: any; className?: string }) {
  return <span className={cn(map[tone], className)}>{children}</span>;
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge tone="gray">—</Badge>;
  const s = status.toUpperCase();
  const tone: Tone =
    ['ENABLED', 'ACTIVE', 'PAID', 'AVAILABLE', 'RESOLVED', 'CLOSED_WON', 'APPROVED'].includes(s) ? 'green' :
    ['DISABLED', 'OVERDUE', 'TERMINATED', 'CANCELLED', 'CLOSED_LOST', 'URGENT'].includes(s) ? 'red' :
    ['PARTIAL', 'PENDING', 'EXPIRED', 'UNDER_MAINTENANCE', 'IN_PROGRESS', 'DRAFT', 'NEGOTIATION'].includes(s) ? 'amber' :
    ['NEW', 'CONTACTED', 'VIEWING', 'OPEN', 'ASSIGNED', 'RENTED', 'RENEWED'].includes(s) ? 'blue' : 'gray';
  return <Badge tone={tone}>{s.replace(/_/g, ' ')}</Badge>;
}
