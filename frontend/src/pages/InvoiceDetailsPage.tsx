import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { useInvoice } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { StatusBadge } from '@shared/ui/Badge';
import { PageLoader } from '@shared/ui/Spinner';
import { formatAed, formatDate } from '@shared/lib/format';
import { CollectRentModal } from '@features/rent/CollectRentModal';
import { Can } from '@shared/auth/useCan';

export function InvoiceDetailsPage() {
  const { id } = useParams();
  const { data: inv, isLoading } = useInvoice(id);
  const [open, setOpen] = useState(false);

  if (isLoading || !inv) return <PageLoader />;
  const balance = inv.amount - inv.paidAmount;

  return (
    <>
      <PageHeader
        title={`Invoice ${inv.number}`}
        breadcrumbs={[{ label: 'Home' }, { label: 'Rent', to: '/rent' }, { label: inv.number }]}
        actions={
          <>
            <Link to="/rent" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>
            <button className="btn-secondary" onClick={() => window.print()}><Printer size={16} /> Print</button>
            {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
              <Can perm="rent.collect">
                <button className="btn-primary" onClick={() => setOpen(true)}><Download size={16} /> Collect Payment</button>
              </Can>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
            <div>
              <div className="text-[11px] font-bold tracking-wider text-brand-700">VANTUS ERP</div>
              <h2 className="text-xl font-bold mt-0.5">Tax Invoice</h2>
              <div className="text-xs text-ink-500 mt-0.5">Issued {formatDate(inv.issueDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-ink-500">Status</div>
              <div className="mt-1"><StatusBadge status={inv.status} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-500 mb-1">Bill To</div>
              <div className="font-bold text-ink-900">{inv.tenant?.name}</div>
              <div className="text-sm text-ink-600">{inv.tenant?.email}</div>
              <div className="text-sm text-ink-600">{inv.tenant?.phone}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-500 mb-1">Property</div>
              <div className="font-bold text-ink-900">{inv.property?.name}</div>
              <div className="text-sm text-ink-600">{inv.property?.code}</div>
              <div className="text-sm text-ink-600">{inv.property?.location?.area}, {inv.property?.location?.city}</div>
            </div>
          </div>

          <table className="min-w-full">
            <thead>
              <tr className="border-y border-line bg-slate-50">
                <th className="px-3 py-2 text-left table-header">Description</th>
                <th className="px-3 py-2 text-left table-header">Period</th>
                <th className="px-3 py-2 text-right table-header">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-3 font-semibold">{inv.type === 'SECURITY_DEPOSIT' ? 'Security deposit' : 'Rent'}</td>
                <td className="px-3 py-3">{inv.period?.label || '—'}</td>
                <td className="px-3 py-3 text-right font-semibold">{formatAed(inv.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 border-t border-line pt-4 grid grid-cols-3 gap-4">
            <div><div className="text-xs text-ink-500">Total</div><div className="text-2xl font-bold">{formatAed(inv.amount)}</div></div>
            <div><div className="text-xs text-ink-500">Paid</div><div className="text-2xl font-bold text-emerald-600">{formatAed(inv.paidAmount)}</div></div>
            <div><div className="text-xs text-ink-500">Balance Due</div><div className="text-2xl font-bold text-rose-600">{formatAed(balance)}</div></div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Payment history" />
          {inv.payments?.length ? (
            <ul className="divide-y divide-line">
              {inv.payments.map((p: any) => (
                <li key={p._id} className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.number}</div>
                      <div className="text-xs text-ink-500">{p.method} · {formatDate(p.paidAt)}</div>
                      {p.reference && <div className="text-xs text-ink-500">Ref: {p.reference}</div>}
                    </div>
                    <div className="font-bold text-emerald-700">{formatAed(p.amount)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-500 py-6 text-center">No payments yet.</p>}
        </Card>
      </div>

      <CollectRentModal invoice={inv} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
