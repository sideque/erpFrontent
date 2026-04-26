import { FormEvent, useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { useCreateProperty, useOwners } from '@entities/index';

export function CreatePropertyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateProperty();
  const { data: ownersList } = useOwners({ limit: 200 });
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
      await create.mutateAsync(payload);
      toast.success('Property created');
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
          <Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        </div>
      </form>
    </Modal>
  );
}
