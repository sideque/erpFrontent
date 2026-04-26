import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTickets, useCreateTicket, useUpdateTicket, useProperties, useTenants } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card } from '@shared/ui/Card';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { Badge, StatusBadge } from '@shared/ui/Badge';
import { Can, useCan } from '@shared/auth/useCan';
import { formatAed, formatDate } from '@shared/lib/format';

const COLUMNS = [
  { key: 'OPEN', label: 'Open', tone: 'blue' as const },
  { key: 'ASSIGNED', label: 'Assigned', tone: 'purple' as const },
  { key: 'IN_PROGRESS', label: 'In Progress', tone: 'amber' as const },
  { key: 'RESOLVED', label: 'Resolved', tone: 'green' as const },
  { key: 'CLOSED', label: 'Closed', tone: 'gray' as const },
];

export function MaintenancePage() {
  const canEdit = useCan('maintenance.edit');
  const { data } = useTickets({ limit: 200 });
  const create = useCreateTicket();
  const update = useUpdateTicket();
  const { data: props } = useProperties({ limit: 200 });
  const { data: tenants } = useTenants({ limit: 200 });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ title: '', description: '', property: '', tenant: '', priority: 'MEDIUM', estimatedCost: 0 });

  const groups: Record<string, any[]> = {};
  COLUMNS.forEach((c) => (groups[c.key] = []));
  (data?.data || []).forEach((t) => { (groups[t.status] ||= []).push(t); });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({ ...form, estimatedCost: Number(form.estimatedCost), tenant: form.tenant || undefined });
      toast.success('Ticket created');
      setOpen(false);
    } catch {}
  };

  const advance = async (t: any, status: string) => {
    await update.mutateAsync({ id: t._id, patch: { status } });
  };

  return (
    <>
      <PageHeader
        title="Maintenance"
        breadcrumbs={[{ label: 'Home' }, { label: 'Maintenance' }]}
        actions={
          <Can perm="maintenance.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Ticket</button>
          </Can>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="card p-3 flex flex-col gap-2 min-h-[300px]">
            <div className="flex items-center justify-between mb-1 px-1">
              <Badge tone={col.tone}>{col.label}</Badge>
              <span className="text-xs text-ink-400">{groups[col.key].length}</span>
            </div>
            <div className="space-y-2 overflow-y-auto">
              {groups[col.key].map((t) => (
                <div key={t._id} className="rounded-xl border border-line bg-white p-3 hover:shadow-card cursor-pointer">
                  <div className="text-[11px] font-bold text-brand-700 tracking-wider">{t.number}</div>
                  <div className="font-semibold text-ink-900 mt-0.5 line-clamp-2">{t.title}</div>
                  <div className="text-xs text-ink-500 mt-1">{t.property?.name}</div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge tone={t.priority === 'URGENT' ? 'red' : t.priority === 'HIGH' ? 'amber' : 'gray'}>{t.priority}</Badge>
                    <span className="text-xs text-ink-500">{formatAed(t.estimatedCost)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    {t.status !== 'CLOSED' && canEdit && (
                      <select
                        className="select !py-1 text-xs"
                        value={t.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => advance(t, e.target.value)}
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
              {groups[col.key].length === 0 && <p className="text-xs text-ink-400 text-center py-6">No tickets</p>}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Maintenance Ticket" width="max-w-lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="tk-form" className="btn-primary">Create</button>
        </>
      }>
        <form id="tk-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Title" required><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field></div>
          <div className="col-span-2"><Field label="Description"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          <Field label="Property" required>
            <Select required value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">— Select —</option>
              {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.code} — {p.name}</option>)}
            </Select>
          </Field>
          <Field label="Tenant">
            <Select value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })}>
              <option value="">— None —</option>
              {tenants?.data?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Priority"><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option>
          </Select></Field>
          <Field label="Estimated Cost (AED)"><Input type="number" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} /></Field>
        </form>
      </Modal>
    </>
  );
}
