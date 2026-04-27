import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTenancyContracts, useCreateTenancyContract, useProperties, useTenants } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { StatusBadge } from '@shared/ui/Badge';
import { Avatar } from '@shared/ui/Avatar';
import { Can } from '@shared/auth/useCan';
import { formatAed, formatDate } from '@shared/lib/format';

export function TenancyContractsPage() {
  const { data, isLoading } = useTenancyContracts({ limit: 100 });
  const { data: props, isLoading: isLoadingProps } = useProperties({ status: 'AVAILABLE,MANAGED', limit: 200 });
  const { data: tenants, isLoading: isLoadingTenants } = useTenants({ limit: 200 });
  const create = useCreateTenancyContract();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    code: '',
    property: '',
    tenant: '',
    annualRent: 0,
    paymentSchedule: 'MONTHLY',
    securityDeposit: 0,
    rentDueDate: 1,
    lateFee: 0,
    gracePeriodDays: 0,
    startDate: '',
    endDate: '',
    rules: 'No pets. No smoking inside.',
    notes: '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({
        ...form,
        annualRent: Number(form.annualRent),
        securityDeposit: Number(form.securityDeposit),
        rentDueDate: Number(form.rentDueDate),
        lateFee: Number(form.lateFee),
        gracePeriodDays: Number(form.gracePeriodDays),
      });
      toast.success('Tenancy contract created. Invoices generated.');
      setOpen(false);
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'code', header: 'Contract', render: (c) => <Link to={`/tenancy-contracts/${c._id}`} className="font-semibold text-brand-700 hover:underline">{c.code}</Link> },
    { key: 'property', header: 'Property', render: (c) => <span>{c.property?.name}</span> },
    { key: 'tenant', header: 'Tenant', render: (c) => (
      <div className="flex items-center gap-2"><Avatar src={c.tenant?.avatar} name={c.tenant?.name} size={28} />
        <span>{c.tenant?.name}</span></div>
    ) },
    { key: 'rent', header: 'Annual Rent', render: (c) => <span className="font-semibold">{formatAed(c.annualRent)}</span> },
    { key: 'sched', header: 'Schedule', render: (c) => <span>{c.paymentSchedule}</span> },
    { key: 'period', header: 'Period', render: (c) => <span>{formatDate(c.startDate)} → {formatDate(c.endDate)}</span> },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Tenancy Contracts"
        breadcrumbs={[{ label: 'Home' }, { label: 'Tenancy Contracts' }]}
        actions={
          <Can perm="tenancyContract.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Contract</button>
          </Can>
        }
      />
      <Table columns={cols} rows={data?.data || []} loading={isLoading} />

      <Modal open={open} onClose={() => setOpen(false)} title="New Tenancy Contract" subtitle="Invoices will be auto-generated based on the schedule." width="max-w-2xl" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="create-tc" className="btn-primary">Create & Generate Invoices</button>
        </>
      }>
        <form id="create-tc" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Field label="Contract Code" required><Input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="TC-2026-001" /></Field>
          <Field label="Payment Schedule"><Select value={form.paymentSchedule} onChange={(e) => setForm({ ...form, paymentSchedule: e.target.value })}>
            <option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="SEMI_ANNUAL">Semi-Annual</option><option value="ANNUAL">Annual</option>
          </Select></Field>
          <Field label="Property" required>
            <Select required value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">— Select available property —</option>
              {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.code} — {p.name}</option>)}
            </Select>
          </Field>
          <Field label="Tenant" required>
            <Select required value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })}>
              <option value="">— Select tenant —</option>
              {tenants?.data?.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Annual Rent (AED)" required><Input type="number" required value={form.annualRent} onChange={(e) => setForm({ ...form, annualRent: e.target.value })} /></Field>
          <Field label="Security Deposit (AED)"><Input type="number" value={form.securityDeposit} onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })} /></Field>
          <Field label="Rent Due Date (Day)"><Input type="number" min="1" max="31" value={form.rentDueDate} onChange={(e) => setForm({ ...form, rentDueDate: e.target.value })} /></Field>
          <Field label="Late Fee (AED)"><Input type="number" value={form.lateFee} onChange={(e) => setForm({ ...form, lateFee: e.target.value })} /></Field>
          <Field label="Grace Period (Days)"><Input type="number" value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: e.target.value })} /></Field>
          <Field label="Start Date" required><Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End Date" required><Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></Field>
          <div className="col-span-2">
            <Field label="Internal Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any specific internal notes about this tenant or contract..." /></Field>
          </div>
        </form>
      </Modal>
    </>
  );
}
