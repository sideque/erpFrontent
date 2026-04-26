import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Building2, BedDouble, Bath, Maximize2, Users } from 'lucide-react';
import { useProperty, useTenancyContracts, useInvoices } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Avatar } from '@shared/ui/Avatar';
import { StatusBadge } from '@shared/ui/Badge';
import { PageLoader } from '@shared/ui/Spinner';
import { formatAed, formatDate, formatNumber } from '@shared/lib/format';

export function PropertyDetailsPage() {
  const { id } = useParams();
  const { data: p, isLoading } = useProperty(id);
  const { data: contracts } = useTenancyContracts({ property: id, limit: 5 });
  const { data: invoices } = useInvoices({ property: id, limit: 8 });

  if (isLoading || !p) return <PageLoader />;

  return (
    <>
      <PageHeader
        title={p.name}
        breadcrumbs={[{ label: 'Home' }, { label: 'Properties' }, { label: p.name }]}
        actions={
          <Link to="/properties" className="btn-secondary"><ArrowLeft size={16} /> Back</Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div
            className="h-72 bg-slate-200 bg-cover bg-center"
            style={{ backgroundImage: p.images?.[0] ? `url(${p.images[0]})` : undefined }}
          />
          <div className="p-5">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-bold tracking-wider text-brand-700">{p.code}</span>
              <StatusBadge status={p.status} />
            </div>
            <h2 className="text-xl font-bold mt-1">{p.name}</h2>
            <p className="text-sm text-ink-500 mt-0.5 flex items-center gap-1.5"><MapPin size={14} /> {p.location?.area}, {p.location?.community} · {p.location?.city}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <Stat icon={<Building2 size={16} />} label="Type" value={p.type} />
              <Stat icon={<Maximize2 size={16} />} label="Size" value={`${formatNumber(p.sizeSqm)} sqm`} />
              <Stat icon={<BedDouble size={16} />} label="Bedrooms" value={p.bedrooms || 0} />
              <Stat icon={<Bath size={16} />} label="Bathrooms" value={p.bathrooms || 0} />
            </div>

            {p.description && <p className="mt-4 text-sm text-ink-700">{p.description}</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Owners" icon={<Users size={18} />} />
          <ul className="space-y-3">
            {p.owners?.map((o: any) => (
              <li key={o.owner._id} className="flex items-center gap-3">
                <Avatar src={o.owner.avatar} name={o.owner.name} />
                <div className="flex-1 min-w-0">
                  <Link to={`/owners/${o.owner._id}`} className="font-semibold text-ink-900 hover:text-brand-700 truncate block">{o.owner.name}</Link>
                  <div className="text-xs text-ink-500 truncate">{o.owner.email}</div>
                </div>
                <div className="text-sm font-bold text-brand-700">{o.percentage}%</div>
              </li>
            )) || <p className="text-sm text-ink-500">No owners assigned.</p>}
          </ul>
          <div className="mt-4 pt-4 border-t border-line text-sm">
            <div className="flex justify-between"><span className="text-ink-500">Annual Rent</span><span className="font-semibold">{formatAed(p.rentEstimate)}</span></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader title="Tenancy Contracts" />
          {contracts?.data?.length ? (
            <ul className="divide-y divide-line">
              {contracts.data.map((c: any) => (
                <li key={c._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-ink-900">{c.code} — {c.tenant?.name}</div>
                    <div className="text-xs text-ink-500">{formatDate(c.startDate)} → {formatDate(c.endDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatAed(c.annualRent)}</div>
                    <StatusBadge status={c.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-500 py-6 text-center">No contracts yet.</p>}
        </Card>

        <Card>
          <CardHeader title="Recent Invoices" />
          {invoices?.data?.length ? (
            <ul className="divide-y divide-line">
              {invoices.data.map((inv: any) => (
                <li key={inv._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{inv.number}</div>
                    <div className="text-xs text-ink-500">{inv.period?.label || inv.type} · due {formatDate(inv.dueDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatAed(inv.amount)}</div>
                    <StatusBadge status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-500 py-6 text-center">No invoices yet.</p>}
        </Card>
      </div>
    </>
  );
}

function Stat({ icon, label, value }: { icon: any; label: string; value: any }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50/40 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-xs text-ink-500">{icon} {label}</div>
      <div className="mt-0.5 font-semibold text-ink-900">{value}</div>
    </div>
  );
}
