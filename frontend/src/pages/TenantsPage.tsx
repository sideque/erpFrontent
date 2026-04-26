import { FormEvent, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTenants, useCreateTenant } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card } from '@shared/ui/Card';
import { Avatar } from '@shared/ui/Avatar';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { Badge } from '@shared/ui/Badge';
import { Can } from '@shared/auth/useCan';

export function TenantsPage() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useTenants({ q, limit: 100 });
  const create = useCreateTenant();
  const [form, setForm] = useState<any>({ name: '', email: '', phone: '', occupation: '', employer: '', nationality: '', riskTag: 'LOW' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success('Tenant created');
      setOpen(false);
      setForm({ name: '', email: '', phone: '', occupation: '', employer: '', nationality: '', riskTag: 'LOW' });
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'name', header: 'Tenant', render: (t) => (
      <div className="flex items-center gap-3"><Avatar src={t.avatar} name={t.name} />
        <div><div className="font-semibold">{t.name}</div><div className="text-xs text-ink-500">{t.email}</div></div></div>
    ) },
    { key: 'phone', header: 'Phone', render: (t) => <span>{t.phone || '—'}</span> },
    { key: 'occ', header: 'Occupation', render: (t) => <span>{t.occupation || '—'}{t.employer ? ` · ${t.employer}` : ''}</span> },
    { key: 'nat', header: 'Nationality', render: (t) => <span>{t.nationality || '—'}</span> },
    { key: 'risk', header: 'Risk', render: (t) => (
      <Badge tone={t.riskTag === 'HIGH' ? 'red' : t.riskTag === 'MEDIUM' ? 'amber' : 'green'}>{t.riskTag}</Badge>
    ) },
    { key: 'bl', header: 'Status', render: (t) => t.blacklisted ? <Badge tone="red">Blacklisted</Badge> : <Badge tone="green">Active</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Tenants"
        breadcrumbs={[{ label: 'Home' }, { label: 'Tenants' }]}
        actions={
          <Can perm="tenant.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Tenant</button>
          </Can>
        }
      />

      <Card className="!p-4 mb-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-9" placeholder="Search tenants…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Table columns={cols} rows={data?.data || []} />

      <Modal open={open} onClose={() => setOpen(false)} title="Add Tenant" width="max-w-lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="create-tenant" className="btn-primary">Create</button>
        </>
      }>
        <form id="create-tenant" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Full Name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Occupation"><Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></Field>
          <Field label="Employer"><Input value={form.employer} onChange={(e) => setForm({ ...form, employer: e.target.value })} /></Field>
          <Field label="Nationality"><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></Field>
          <Field label="Risk Tag"><Select value={form.riskTag} onChange={(e) => setForm({ ...form, riskTag: e.target.value })}>
            <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
          </Select></Field>
        </form>
      </Modal>
    </>
  );
}
