import { FormEvent, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { useCreateProperty, useOwners, useUploadPropertyImage, MAX_PROPERTY_IMAGES } from '@entities/index';
import { ImageCropModal } from '@features/property/ImageCropModal';

type Pending = { file: File; preview: string };

export function CreatePropertyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProperty();
  const uploadImg = useUploadPropertyImage();
  const { data: ownersList } = useOwners({ limit: 200 });
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [form, setForm] = useState<any>({
    code: '',
    name: '',
    type: 'APARTMENT',
    status: 'AVAILABLE',
    location: { area: '', community: '', city: 'Dubai' },
    sizeSqm: 0,
    bedrooms: 0,
    bathrooms: 0,
    rentEstimate: 0,
    description: '',
    owners: [{ owner: '', percentage: 100 }],
  });

  const set = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));
  const setLoc = (patch: any) => setForm((f: any) => ({ ...f, location: { ...f.location, ...patch } }));

  useEffect(() => {
    if (!open) {
      setPending((prev) => {
        prev.forEach((x) => URL.revokeObjectURL(x.preview));
        return [];
      });
      setCropSrc(null);
      setCropOpen(false);
    }
  }, [open]);

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(f);
  };

  const onCropped = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPending((p) => [...p, { file, preview }]);
  };

  const removePending = (index: number) => {
    setPending((p) => {
      const next = p.filter((_, i) => i !== index);
      if (p[index]) URL.revokeObjectURL(p[index].preview);
      return next;
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sizeSqm: Number(form.sizeSqm),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        rentEstimate: Number(form.rentEstimate),
        owners: form.owners.filter((o: any) => o.owner).map((o: any) => ({ owner: o.owner, percentage: Number(o.percentage) })),
      };
      const created = await create.mutateAsync(payload);
      if (created?._id && pending.length) {
        for (const { file } of pending) {
          await uploadImg.mutateAsync({ id: created._id, file });
        }
        toast.success('Property created and photos uploaded');
      } else {
        toast.success('Property created');
      }
      onClose();
    } catch {}
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Property"
      subtitle="Create a new property unit in your portfolio."
      width="max-w-2xl"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button form="create-property-form" type="submit" className="btn-primary">Create</button>
        </>
      }
    >
      <form id="create-property-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Field label="Property Code" required>
          <Input value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="VAN-A101" required />
        </Field>
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Marina Heights — A101" required />
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => set({ type: e.target.value })}>
            <option value="APARTMENT">Apartment</option>
            <option value="VILLA">Villa</option>
            <option value="OFFICE">Office</option>
            <option value="LAND">Land</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="AVAILABLE">Available</option>
            <option value="RENTED">Rented</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </Select>
        </Field>
        <Field label="Area"><Input value={form.location.area} onChange={(e) => setLoc({ area: e.target.value })} placeholder="Dubai Marina" /></Field>
        <Field label="Community"><Input value={form.location.community} onChange={(e) => setLoc({ community: e.target.value })} placeholder="Marina Heights" /></Field>
        <Field label="Size (sqm)"><Input type="number" value={form.sizeSqm} onChange={(e) => set({ sizeSqm: e.target.value })} /></Field>
        <Field label="Annual Rent (AED)"><Input type="number" value={form.rentEstimate} onChange={(e) => set({ rentEstimate: e.target.value })} /></Field>
        <Field label="Bedrooms"><Input type="number" value={form.bedrooms} onChange={(e) => set({ bedrooms: e.target.value })} /></Field>
        <Field label="Bathrooms"><Input type="number" value={form.bathrooms} onChange={(e) => set({ bathrooms: e.target.value })} /></Field>

        <div className="col-span-2">
          <label className="label">Owners (must total 100%)</label>
          <div className="space-y-2">
            {form.owners.map((o: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <select className="select flex-1" value={o.owner} onChange={(e) => {
                  const next = [...form.owners];
                  next[i].owner = e.target.value;
                  set({ owners: next });
                }}>
                  <option value="">— Select owner —</option>
                  {ownersList?.data?.map((ow) => (<option key={ow._id} value={ow._id}>{ow.name}</option>))}
                </select>
                <input className="input w-24" type="number" value={o.percentage} onChange={(e) => {
                  const next = [...form.owners];
                  next[i].percentage = e.target.value;
                  set({ owners: next });
                }} placeholder="%" />
                <button type="button" className="btn-ghost" onClick={() => set({ owners: form.owners.filter((_: any, idx: number) => idx !== i) })}>×</button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => set({ owners: [...form.owners, { owner: '', percentage: 0 }] })}>+ Add owner</button>
          </div>
        </div>

        <div className="col-span-2">
          <div className="mb-1 label">Property photos (optional, max {MAX_PROPERTY_IMAGES})</div>
          <p className="text-xs text-ink-500 mb-2">Crop to 4:3. Photos upload right after the property is created.</p>
          <div className="flex flex-wrap gap-2 items-center">
            {pending.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-line bg-slate-100 shrink-0 group">
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  className="absolute top-0.5 right-0.5 p-0.5 rounded bg-ink-900/60 text-white opacity-0 group-hover:opacity-100 transition"
                  onClick={() => removePending(i)}
                  aria-label="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {pending.length < MAX_PROPERTY_IMAGES && (
              <button
                type="button"
                className="btn-secondary border-dashed h-20 px-3 inline-flex items-center gap-1.5"
                onClick={() => fileRef.current?.click()}
              >
                <ImageIcon size={16} />
                Add photo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPickFile} />
          </div>
        </div>

        <div className="col-span-2">
          <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        </div>
      </form>
      <ImageCropModal
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          setCropSrc(null);
        }}
        imageSrc={cropSrc}
        onCropped={onCropped}
      />
    </Modal>
  );
}
