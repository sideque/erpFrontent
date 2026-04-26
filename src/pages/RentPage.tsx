import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, AlertTriangle, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useInvoices, useRentDashboard, usePayments } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Table, Column } from '@shared/ui/Table';
import { StatusBadge } from '@shared/ui/Badge';
import { Avatar } from '@shared/ui/Avatar';
import { KpiCard } from '@widgets/KpiCard';
import { formatAed, formatDate } from '@shared/lib/format';
import { CollectRentModal } from '@features/rent/CollectRentModal';
import { useCan } from '@shared/auth/useCan';

export function RentPage() {
  const [tab, setTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');
  const [status, setStatus] = useState('');
  const [picked, setPicked] = useState<any | null>(null);
  const canCollect = useCan('rent.collect');
  const { data: dash } = useRentDashboard();
  const { data: invs } = useInvoices({ status, limit: 100 });
  const { data: pays } = usePayments({ limit: 100 });

  const monthly = (dash?.monthly || []).map((m: any) => ({
    label: `${String(m._id.m).padStart(2, '0')}/${String(m._id.y).slice(2)}`,
    amount: m.total,
  }));

  const cols: Column<any>[] = [
    { key: 'num', header: 'Invoice', render: (i) => (
      <Link to={`/rent/invoices/${i._id}`} className="font-semibold text-brand-700 hover:underline">{i.number}</Link>
    ) },
    { key: 'tenant', header: 'Tenant', render: (i) => (
      <div className="flex items-center gap-2"><Avatar src={i.tenant?.avatar} name={i.tenant?.name} size={28} />
        <div><div className="font-medium">{i.tenant?.name}</div><div className="text-xs text-ink-500">{i.property?.name}</div></div></div>
    ) },
    { key: 'period', header: 'Period', render: (i) => <span>{i.period?.label || i.type}</span> },
    { key: 'due', header: 'Due', render: (i) => <span>{formatDate(i.dueDate)}</span> },
    { key: 'amt', header: 'Amount', className: 'text-right', render: (i) => <span className="font-semibold">{formatAed(i.amount)}</span> },
    { key: 'paid', header: 'Paid', className: 'text-right', render: (i) => <span className="text-emerald-700">{formatAed(i.paidAmount)}</span> },
    { key: 'bal', header: 'Balance', className: 'text-right', render: (i) => <span className={i.amount - i.paidAmount > 0 ? 'text-rose-600 font-semibold' : ''}>{formatAed(i.amount - i.paidAmount)}</span> },
    { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
    { key: 'act', header: '', render: (i) => i.status !== 'PAID' && i.status !== 'CANCELLED' && canCollect && (
      <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={(e) => { e.stopPropagation(); setPicked(i); }}>Collect</button>
    ) },
  ];

  const payCols: Column<any>[] = [
    { key: 'num', header: 'Payment', render: (p) => <span className="font-semibold">{p.number}</span> },
    { key: 'inv', header: 'Invoice', render: (p) => <span>{p.invoice?.number}</span> },
    { key: 'tenant', header: 'Tenant', render: (p) => <span>{p.tenant?.name}</span> },
    { key: 'prop', header: 'Property', render: (p) => <span>{p.property?.name}</span> },
    { key: 'method', header: 'Method', render: (p) => <span className="badge-gray badge">{p.method}</span> },
    { key: 'ref', header: 'Reference', render: (p) => <span>{p.reference || '—'}</span> },
    { key: 'date', header: 'Date', render: (p) => formatDate(p.paidAt) },
    { key: 'amt', header: 'Amount', className: 'text-right', render: (p) => <span className="font-bold text-emerald-700">{formatAed(p.amount)}</span> },
  ];

  return (
    <>
      <PageHeader title="Rent & Invoices" breadcrumbs={[{ label: 'Home' }, { label: 'Rent' }]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Pending" value={formatAed(dash?.byStatus?.PENDING?.amount || 0)} hint={`${dash?.byStatus?.PENDING?.count || 0} invoices`} icon={<FileText size={18} />} tone="brand" />
        <KpiCard label="Paid" value={formatAed(dash?.byStatus?.PAID?.paid || 0)} hint={`${dash?.byStatus?.PAID?.count || 0} invoices`} icon={<Wallet size={18} />} tone="green" />
        <KpiCard label="Partial" value={formatAed(dash?.byStatus?.PARTIAL?.paid || 0)} hint={`${dash?.byStatus?.PARTIAL?.count || 0} invoices`} icon={<TrendingUp size={18} />} tone="amber" />
        <KpiCard label="Overdue" value={dash?.overdue || 0} hint="Need follow-up" icon={<AlertTriangle size={18} />} tone="rose" />
      </div>

      <Card className="mb-6">
        <CardHeader title="Collections — last 12 months" />
        <div className="h-56 -ml-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => formatAed(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }} />
              <Bar dataKey="amount" fill="#3b6dff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <div className="inline-flex rounded-xl border border-line bg-white p-1">
          {(['INVOICES', 'PAYMENTS'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab === t ? 'bg-brand-50 text-brand-700' : 'text-ink-600'}`}>
              {t === 'INVOICES' ? 'Invoices' : 'Payments'}
            </button>
          ))}
        </div>
        {tab === 'INVOICES' && (
          <select className="select w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        )}
      </div>

      {tab === 'INVOICES' ? (
        <Table columns={cols} rows={invs?.data || []} />
      ) : (
        <Table columns={payCols} rows={pays?.data || []} />
      )}

      <CollectRentModal invoice={picked} open={!!picked} onClose={() => setPicked(null)} />
    </>
  );
}
