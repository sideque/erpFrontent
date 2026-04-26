import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ShieldCheck } from 'lucide-react';
import { useOwners, useCreateOwner } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card } from '@shared/ui/Card';
import { Avatar } from '@shared/ui/Avatar';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { Badge } from '@shared/ui/Badge';
import { Can } from '@shared/auth/useCan';
import toast from 'react-hot-toast';

export function OwnersPage() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useOwners({ q, limit: 100 });
  const create = useCreateOwner();
  const [form, setForm] = useState<any>({ name: '', email: '', phone: '', nationality: 'UAE', idType: 'EMIRATES_ID', idNumber: '' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success('Owner created');
      setOpen(false);
      setForm({ name: '', email: '', phone: '', nationality: 'UAE', idType: 'EMIRATES_ID', idNumber: '' });
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'name', header: 'Owner', width: '32%', render: (o) => (
      <div className="flex items-center gap-3"><Avatar src={o.avatar} name={o.name} />
        <div><div className="font-semibold">{o.name}</div><div className="text-xs text-ink-500">{o.email}</div></div></div>
    ) },
    { key: 'phone', header: 'Phone', render: (o) => <span>{o.phone || '—'}</span> },
    { key: 'nat', header: 'Nationality', render: (o) => <span>{o.nationality || '—'}</span> },
    { key: 'id', header: 'ID', render: (o) => <span>{o.idType?.replace('_', ' ')} · {o.idNumber || '—'}</span> },
    { key: 'verified', header: 'Verified', render: (o) => o.verified ? <Badge tone="green"><ShieldCheck size={12} /> Verified</Badge> : <Badge tone="amber">Pending</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Owners"
        breadcrumbs={[{ label: 'Home' }, { label: 'Owners' }]}
        actions={
          <Can perm="owner.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Owner</button>
          </Can>
        }
      />

      <Card className="!p-4 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search owners…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Table columns={cols} rows={data?.data || []} onRowClick={(o) => nav(`/owners/${o._id}`)} />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Owner" width="max-w-lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="create-owner" className="btn-primary">Create</button>
        </>
      }>
        <form id="create-owner" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Full Name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Nationality"><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></Field>
          <Field label="ID Type"><Select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
            <option value="EMIRATES_ID">Emirates ID</option><option value="PASSPORT">Passport</option>
          </Select></Field>
          <div className="col-span-2"><Field label="ID Number"><Input value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></Field></div>
        </form>
      </Modal>
    </>
  );
}
