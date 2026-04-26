import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, BedDouble } from 'lucide-react';
import { useProperties, usePropertySummary } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card } from '@shared/ui/Card';
import { StatusBadge } from '@shared/ui/Badge';
import { formatAed, formatNumber } from '@shared/lib/format';
import { CreatePropertyModal } from '@features/property/CreatePropertyModal';
import { Can } from '@shared/auth/useCan';

export function PropertiesPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);

  const params = useMemo(() => ({ q, type, status, limit: 50 }), [q, type, status]);
  const { data } = useProperties(params);
  const { data: summary } = usePropertySummary();

  return (
    <>
      <PageHeader
        title="Properties"
        breadcrumbs={[{ label: 'Home' }, { label: 'Properties' }]}
        actions={
          <Can perm="property.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Property</button>
          </Can>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card><div className="text-xs text-ink-500">Total</div><div className="text-2xl font-bold mt-1">{summary?.total ?? '—'}</div></Card>
        <Card><div className="text-xs text-ink-500">Rented</div><div className="text-2xl font-bold mt-1 text-emerald-600">{summary?.status?.RENTED ?? 0}</div></Card>
        <Card><div className="text-xs text-ink-500">Available</div><div className="text-2xl font-bold mt-1 text-brand-600">{summary?.status?.AVAILABLE ?? 0}</div></Card>
        <Card><div className="text-xs text-ink-500">Occupancy</div><div className="text-2xl font-bold mt-1">{summary?.occupancy ?? 0}%</div></Card>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search by name, code, area…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="select w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="OFFICE">Office</option>
          <option value="LAND">Land</option>
        </select>
        <select className="select w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="AVAILABLE">Available</option>
          <option value="RENTED">Rented</option>
          <option value="UNDER_MAINTENANCE">Maintenance</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data?.map((p: any) => (
          <button
            key={p._id}
            onClick={() => nav(`/properties/${p._id}`)}
            className="card text-left overflow-hidden p-0 hover:shadow-pop transition group"
          >
            <div
              className="h-36 bg-slate-200 bg-cover bg-center"
              style={{ backgroundImage: p.images?.[0] ? `url(${p.images[0]})` : undefined }}
            />
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-brand-700 tracking-wider">{p.code}</span>
                <StatusBadge status={p.status} />
              </div>
              <h3 className="mt-1 text-base font-semibold text-ink-900 truncate">{p.name}</h3>
              <div className="mt-1 text-xs text-ink-500 flex items-center gap-1.5">
                <MapPin size={12} /> {p.location?.area || '—'}, {p.location?.city || 'Dubai'}
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-600">
                <span className="inline-flex items-center gap-1"><Building2 size={12} /> {p.type}</span>
                {p.bedrooms ? <span className="inline-flex items-center gap-1"><BedDouble size={12} /> {p.bedrooms} BR</span> : null}
                <span>{formatNumber(p.sizeSqm)} sqm</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-bold text-ink-900">{formatAed(p.rentEstimate)}<span className="text-xs text-ink-500 font-normal">/yr</span></span>
                <span className="text-xs text-ink-400">{p.owners?.length || 0} owner(s)</span>
              </div>
            </div>
          </button>
        ))}
        {data?.data?.length === 0 && <Card className="lg:col-span-3 text-center text-ink-500">No properties found.</Card>}
      </div>

      <CreatePropertyModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
