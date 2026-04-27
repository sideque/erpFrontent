import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, BedDouble, ImagePlus } from 'lucide-react';
import { useProperties, usePropertySummary, useUploadPropertyImage, MAX_PROPERTY_IMAGES, type Property } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card } from '@shared/ui/Card';
import { StatusBadge } from '@shared/ui/Badge';
import { formatAed, formatNumber } from '@shared/lib/format';
import { publicAssetUrl } from '@shared/lib/publicAssetUrl';
import { CreatePropertyModal } from '@features/property/CreatePropertyModal';
import { ImageCropModal } from '@features/property/ImageCropModal';
import { Can, useCan } from '@shared/auth/useCan';

export function PropertiesPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploadPropertyId, setUploadPropertyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadImg = useUploadPropertyImage();
  const canEdit = useCan('property.edit');

  const params = useMemo(() => ({ q, type, status, limit: 50 }), [q, type, status]);
  const { data } = useProperties(params);
  const { data: summary } = usePropertySummary();

  const startPickForProperty = (propertyId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadPropertyId(propertyId);
    fileRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.onerror = () => setUploadPropertyId(null);
    reader.readAsDataURL(f);
  };

  const onCropped = (file: File) => {
    if (uploadPropertyId) {
      void uploadImg.mutateAsync({ id: uploadPropertyId, file });
    }
  };

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

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data?.map((p: Property) => {
          const imgCount = p.images?.length ?? 0;
          const atLimit = imgCount >= MAX_PROPERTY_IMAGES;
          return (
            <div
              key={p._id}
              className="card text-left overflow-hidden p-0 hover:shadow-pop transition group relative"
            >
              {canEdit && !atLimit && (
                <button
                  type="button"
                  className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1.5 text-xs font-medium text-ink-800 shadow border border-line hover:bg-white"
                  onClick={(e) => startPickForProperty(p._id, e)}
                  title="Add photo (crop)"
                >
                  <ImagePlus size={14} />
                  Photo
                </button>
              )}
              <div
                role="button"
                tabIndex={0}
                onClick={() => nav(`/properties/${p._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    nav(`/properties/${p._id}`);
                  }
                }}
                className="cursor-pointer text-left w-full"
              >
                <div
                  className="h-36 bg-slate-200 bg-cover bg-center"
                  style={{ backgroundImage: p.images?.[0] ? `url(${publicAssetUrl(p.images[0])})` : undefined }}
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
                    <span className="text-xs text-ink-400">{(p.owners?.length ?? 0) || 0} owner(s)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {data?.data?.length === 0 && <Card className="lg:col-span-3 text-center text-ink-500">No properties found.</Card>}
      </div>

      <CreatePropertyModal open={open} onClose={() => setOpen(false)} />
      <ImageCropModal
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          setCropSrc(null);
          setUploadPropertyId(null);
        }}
        imageSrc={cropSrc}
        onCropped={onCropped}
      />
    </>
  );
}
