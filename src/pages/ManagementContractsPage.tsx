import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useManagementContracts, useCreateManagementContract, useProperties, useOwners } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { StatusBadge } from '@shared/ui/Badge';
import { Can } from '@shared/auth/useCan';
import { formatDate } from '@shared/lib/format';

export function ManagementContractsPage() {
  const { data } = useManagementContracts({ limit: 100 });
  const { data: props } = useProperties({ limit: 200 });
  const { data: owners } = useOwners({ limit: 200 });
  const create = useCreateManagementContract();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    code: '',
    property: '',
    owners: [] as string[],
    commissionPct: 5,
    startDate: '',
    endDate: '',
    expensesBornBy: 'OWNER',
    incomeRule: 'NET_AFTER_EXPENSES',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({ ...form, commissionPct: Number(form.commissionPct), owners: form.owners.filter(Boolean) });
      toast.success('Contract created');
      setOpen(false);
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'code', header: 'Contract', render: (c) => <span className="font-semibold">{c.code}</span> },
    { key: 'property', header: 'Property', render: (c) => <span>{c.property?.name}</span> },
    { key: 'owners', header: 'Owner(s)', render: (c) => <span>{c.owners?.map((o: any) => o.name).join(', ') || '—'}</span> },
    { key: 'commission', header: 'Commission', render: (c) => <span className="font-semibold">{c.commissionPct}%</span> },
    { key: 'period', header: 'Period', render: (c) => <span>{formatDate(c.startDate)} → {formatDate(c.endDate)}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Management Contracts"
        breadcrumbs={[{ label: 'Home' }, { label: 'Mgmt. Contracts' }]}
        actions={
          <Can perm="mgmtContract.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Contract</button>
          </Can>
        }
      />
      <Table columns={cols} rows={data?.data || []} />

      <Modal open={open} onClose={() => setOpen(false)} title="Create Management Contract" width="max-w-2xl" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="create-mc" className="btn-primary">Create</button>
        </>
      }>
        <form id="create-mc" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Field label="Contract Code" required><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="MC-2026-001" /></Field>
          <Field label="Commission %" required><Input type="number" required value={form.commissionPct} onChange={(e) => setForm({ ...form, commissionPct: e.target.value })} /></Field>
          <Field label="Property" required>
            <Select required value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">— Select —</option>
              {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.code} — {p.name}</option>)}
            </Select>
          </Field>
          <Field label="Expenses Born By"><Select value={form.expensesBornBy} onChange={(e) => setForm({ ...form, expensesBornBy: e.target.value })}>
            <option value="OWNER">Owner</option><option value="COMPANY">Company</option><option value="SHARED">Shared</option>
          </Select></Field>
          <Field label="Start Date" required><Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End Date" required><Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <div className="col-span-2">
            <label className="label">Owners</label>
            <select multiple className="select min-h-[120px]" value={form.owners} onChange={(e) => {
              const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
              setForm({ ...form, owners: opts });
            }}>
              {owners?.data?.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
            </select>
            <p className="text-xs text-ink-400 mt-1">Hold Ctrl/Cmd to select multiple.</p>
          </div>
        </form>
      </Modal>
    </>
  );
}
