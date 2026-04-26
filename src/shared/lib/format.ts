export const formatAed = (n: number | undefined | null) =>
  new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED', maximumFractionDigits: 0 })
    .format(Number(n || 0));

export const formatNumber = (n: number | undefined | null) =>
  new Intl.NumberFormat('en-AE').format(Number(n || 0));

export const formatDate = (d: string | Date | undefined | null) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (d: string | Date | undefined | null) => {
  if (!d) return '—';
  const dt = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const initials = (name?: string) =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('') || '?';

export const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');
