import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2 } from 'lucide-react';
import { useOwner, useOwnerStatements } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Avatar } from '@shared/ui/Avatar';
import { Badge, StatusBadge } from '@shared/ui/Badge';
import { PageLoader } from '@shared/ui/Spinner';
import { formatAed, formatDate } from '@shared/lib/format';

export function OwnerProfilePage() {
  const { id } = useParams();
  const { data: o, isLoading } = useOwner(id);
  const { data: stmts } = useOwnerStatements({ owner: id, limit: 10 });

  if (isLoading || !o) return <PageLoader />;

  return (
    <>
      <PageHeader
        title={o.name}
        breadcrumbs={[{ label: 'Home' }, { label: 'Owners' }, { label: o.name }]}
        actions={<Link to="/owners" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-2">
            <Avatar src={o.avatar} name={o.name} size={88} />
            <h2 className="mt-3 font-bold text-ink-900">{o.name}</h2>
            {o.verified && <Badge tone="green" className="mt-1">Verified</Badge>}
          </div>
          <div className="mt-4 pt-4 border-t border-line space-y-3 text-sm">
            <Row icon={<Mail size={14} />} label="Email" value={o.email} />
            <Row icon={<Phone size={14} />} label="Phone" value={o.phone} />
            <Row label="Nationality" value={o.nationality} />
            <Row label="ID" value={`${o.idType?.replace('_', ' ')} · ${o.idNumber || '—'}`} />
            <Row label="Bank" value={o.bankAccount?.bankName} />
            <Row label="IBAN" value={o.bankAccount?.iban} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Properties owned" icon={<Building2 size={18} />} />
          {o.properties?.length ? (
            <ul className="divide-y divide-line">
              {o.properties.map((p: any) => (
                <li key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link to={`/properties/${p._id}`} className="font-semibold text-ink-900 hover:text-brand-700">{p.name}</Link>
                    <div className="text-xs text-ink-500">{p.code} · {p.location?.area || ''}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatAed(p.rentEstimate)}/yr</div>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-500 py-6 text-center">No properties.</p>}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Owner statements" subtitle="Monthly settlements & payouts" />
        {stmts?.data?.length ? (
          <table className="min-w-full">
            <thead><tr className="text-left">
              <th className="px-2 py-2 table-header">Number</th>
              <th className="px-2 py-2 table-header">Period</th>
              <th className="px-2 py-2 table-header">Property</th>
              <th className="px-2 py-2 table-header text-right">Gross</th>
              <th className="px-2 py-2 table-header text-right">Expenses</th>
              <th className="px-2 py-2 table-header text-right">Commission</th>
              <th className="px-2 py-2 table-header text-right">Net Payout</th>
              <th className="px-2 py-2 table-header">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-line text-sm">
              {stmts.data.map((s: any) => (
                <tr key={s._id}>
                  <td className="px-2 py-2.5 font-semibold">{s.number}</td>
                  <td className="px-2 py-2.5">{s.period?.label}</td>
                  <td className="px-2 py-2.5">{s.property?.name}</td>
                  <td className="px-2 py-2.5 text-right">{formatAed(s.grossIncome)}</td>
                  <td className="px-2 py-2.5 text-right text-rose-600">{formatAed(s.totalExpenses)}</td>
                  <td className="px-2 py-2.5 text-right text-amber-600">{formatAed(s.commission)}</td>
                  <td className="px-2 py-2.5 text-right font-bold">{formatAed(s.netPayout)}</td>
                  <td className="px-2 py-2.5"><StatusBadge status={s.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-sm text-ink-500 py-6 text-center">No statements yet. Generate one from <Link to="/accounting/owner-statements" className="text-brand-700 font-semibold">Owner Statements</Link>.</p>}
      </Card>
    </>
  );
}

function Row({ icon, label, value }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-ink-500">{icon}{label}</span>
      <span className="font-medium text-ink-900 truncate">{value || '—'}</span>
    </div>
  );
}
