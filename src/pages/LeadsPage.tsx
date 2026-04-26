import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLeadPipeline, useCreateLead, useUpdateLead } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { Avatar } from '@shared/ui/Avatar';
import { Badge } from '@shared/ui/Badge';
import { Can, useCan } from '@shared/auth/useCan';
import { formatAed, formatDate } from '@shared/lib/format';

const STAGES = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'] as const;

export function LeadsPage() {
  const canEdit = useCan('lead.edit');
  const { data } = useLeadPipeline();
  const create = useCreateLead();
  const update = useUpdateLead();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ name: '', email: '', phone: '', propertyType: 'APARTMENT', source: 'WEBSITE', stage: 'NEW', notes: '' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success('Lead added');
      setOpen(false);
    } catch {}
  };

  const moveTo = async (lead: any, stage: string) => {
    await update.mutateAsync({ id: lead._id, patch: { stage } });
  };

  return (
    <>
      <PageHeader
        title="CRM Leads"
        breadcrumbs={[{ label: 'Home' }, { label: 'Leads' }]}
        actions={
          <Can perm="lead.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Lead</button>
          </Can>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {STAGES.map((stage) => (
          <div key={stage} className="card p-3 min-h-[400px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-700">{stage.replaceAll('_', ' ')}</span>
              <span className="text-xs text-ink-400">{data?.[stage]?.length || 0}</span>
            </div>
            <div className="space-y-2">
              {(data?.[stage] || []).map((l: any) => (
                <div key={l._id} className="rounded-xl border border-line bg-white p-3 hover:shadow-card">
                  <div className="font-semibold">{l.name}</div>
                  <div className="text-xs text-ink-500">{l.email || l.phone}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge tone="purple">{l.propertyType}</Badge>
                    <span className="text-xs text-ink-500">{formatAed(l.budgetMax)}</span>
                  </div>
                  {l.agent && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-600">
                      <Avatar src={l.agent.avatar} name={l.agent.name} size={20} /> {l.agent.name}
                    </div>
                  )}
                  {l.nextFollowUp && <div className="mt-1 text-[11px] text-ink-400">Follow up: {formatDate(l.nextFollowUp)}</div>}
                  {canEdit && (
                    <select className="select !py-1 text-xs mt-2" value={l.stage} onChange={(e) => moveTo(l, e.target.value)}>
                      {STAGES.map((s) => <option key={s} value={s}>{s.replaceAll('_', ' ')}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Lead" width="max-w-lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="lead-form" className="btn-primary">Create</button>
        </>
      }>
        <form id="lead-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Property Type"><Select value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}>
            <option>APARTMENT</option><option>VILLA</option><option>OFFICE</option><option>LAND</option>
          </Select></Field>
          <Field label="Source"><Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
            <option>WEBSITE</option><option>WALK_IN</option><option>REFERRAL</option><option>PORTAL</option><option>OTHER</option>
          </Select></Field>
          <div className="col-span-2"><Field label="Notes"><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </form>
      </Modal>
    </>
  );
}
