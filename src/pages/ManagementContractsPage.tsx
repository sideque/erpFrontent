import { FormEvent, useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useManagementContracts, useCreateManagementContract, useProperties, useOwners } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { StatusBadge } from '@shared/ui/Badge';
import { Can } from '@shared/auth/useCan';
import { formatDate, formatAed } from '@shared/lib/format';

export function ManagementContractsPage() {
  const [filters, setFilters] = useState<any>({ contractStatus: '', propertyId: '', ownerId: '' });
  const { data, isLoading } = useManagementContracts({ limit: 100, ...filters });
  const { data: props } = useProperties({ limit: 500 });
  const { data: owners } = useOwners({ limit: 500 });
  const create = useCreateManagementContract();
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    propertyId: '',
    ownerId: '',
    contractStartDate: '',
    contractEndDate: '',
    autoRenew: false,
    contractStatus: 'Pending',
    commissionType: 'Percentage',
    commissionValue: 5,
    ownerSharePercentage: 95,
    companySharePercentage: 5,
    paymentCycle: 'Monthly',
    expenseResponsibility: 'Owner',
    expenseApprovalRequired: true,
    expenseLimit: 0,
    canCollectRent: true,
    canManageTenants: true,
    canHandleMaintenance: true,
    canListProperty: true,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success('Management contract created successfully');
      setOpen(false);
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'property', header: 'Property', render: (c) => (
      <Link to={`/management-contracts/${c._id}`} className="font-semibold text-brand-700 hover:underline">
        {c.propertyId?.name || '—'}
      </Link>
    )},
    { key: 'owner', header: 'Owner', render: (c) => <span>{c.ownerId?.name || '—'}</span> },
    { key: 'period', header: 'Contract Period', render: (c) => (
      <span className="text-sm">
        {formatDate(c.contractStartDate)} — {formatDate(c.contractEndDate)}
      </span>
    )},
    { key: 'financials', header: 'Commission', render: (c) => (
      <span className="font-semibold">
        {c.commissionType === 'Percentage' ? `${c.commissionValue}%` : formatAed(c.commissionValue)}
      </span>
    )},
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.contractStatus} /> },
  ];

  return (
    <>
      <PageHeader
        title="Management Contracts"
        breadcrumbs={[{ label: 'Home' }, { label: 'Management Contracts' }]}
        actions={
          <Can perm="mgmtContract.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> New Contract</button>
          </Can>
        }
      />

      <div className="card mb-6 p-4 flex flex-wrap gap-4 items-end">
        <div className="w-48">
          <label className="label">Status</label>
          <Select value={filters.contractStatus} onChange={(e) => setFilters({ ...filters, contractStatus: e.target.value })}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Expired">Expired</option>
            <option value="Terminated">Terminated</option>
          </Select>
        </div>
        <div className="w-64">
          <label className="label">Property</label>
          <Select value={filters.propertyId} onChange={(e) => setFilters({ ...filters, propertyId: e.target.value })}>
            <option value="">All Properties</option>
            {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </Select>
        </div>
        <div className="w-64">
          <label className="label">Owner</label>
          <Select value={filters.ownerId} onChange={(e) => setFilters({ ...filters, ownerId: e.target.value })}>
            <option value="">All Owners</option>
            {owners?.data?.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
          </Select>
        </div>
        <button className="btn-secondary" onClick={() => setFilters({ contractStatus: '', propertyId: '', ownerId: '' })}>Reset</button>
      </div>

      <Table columns={cols} rows={data?.data || []} loading={isLoading} />

      <Modal open={open} onClose={() => setOpen(false)} title="New Management Contract" width="max-w-4xl" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="create-mc" className="btn-primary">Create Contract</button>
        </>
      }>
        <form id="create-mc" onSubmit={submit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <h3 className="col-span-2 font-bold text-ink-900 border-b pb-2">Basic Info</h3>
            <Field label="Property" required>
              <Select required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
                <option value="">Select Property</option>
                {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.code})</option>)}
              </Select>
            </Field>
            <Field label="Owner" required>
              <Select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Select Owner</option>
                {owners?.data?.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
              </Select>
            </Field>
            <Field label="Start Date" required><Input type="date" required value={form.contractStartDate} onChange={(e) => setForm({ ...form, contractStartDate: e.target.value })} /></Field>
            <Field label="End Date" required><Input type="date" required value={form.contractEndDate} onChange={(e) => setForm({ ...form, contractEndDate: e.target.value })} /></Field>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="autoRenew" checked={form.autoRenew} onChange={(e) => setForm({ ...form, autoRenew: e.target.checked })} />
              <label htmlFor="autoRenew" className="text-sm font-medium">Auto Renew</label>
            </div>
            <Field label="Initial Status">
              <Select value={form.contractStatus} onChange={(e) => setForm({ ...form, contractStatus: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
              </Select>
            </Field>

            <h3 className="col-span-2 font-bold text-ink-900 border-b pb-2 mt-4">Financial Terms</h3>
            <Field label="Commission Type">
              <Select value={form.commissionType} onChange={(e) => setForm({ ...form, commissionType: e.target.value })}>
                <option value="Percentage">Percentage</option>
                <option value="Fixed">Fixed</option>
              </Select>
            </Field>
            <Field label="Commission Value" required>
              <Input type="number" required value={form.commissionValue} onChange={(e) => setForm({ ...form, commissionValue: Number(e.target.value) })} />
            </Field>
            <Field label="Owner Share %" required>
              <Input type="number" required value={form.ownerSharePercentage} onChange={(e) => setForm({ ...form, ownerSharePercentage: Number(e.target.value), companySharePercentage: 100 - Number(e.target.value) })} />
            </Field>
            <Field label="Company Share %" required>
              <Input type="number" required value={form.companySharePercentage} onChange={(e) => setForm({ ...form, companySharePercentage: Number(e.target.value), ownerSharePercentage: 100 - Number(e.target.value) })} />
            </Field>
            <Field label="Payment Cycle">
              <Select value={form.paymentCycle} onChange={(e) => setForm({ ...form, paymentCycle: e.target.value })}>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </Select>
            </Field>

            <h3 className="col-span-2 font-bold text-ink-900 border-b pb-2 mt-4">Expense Rules</h3>
            <Field label="Responsibility">
              <Select value={form.expenseResponsibility} onChange={(e) => setForm({ ...form, expenseResponsibility: e.target.value })}>
                <option value="Owner">Owner</option>
                <option value="Company">Company</option>
                <option value="Shared">Shared</option>
              </Select>
            </Field>
            <Field label="Expense Limit"><Input type="number" value={form.expenseLimit} onChange={(e) => setForm({ ...form, expenseLimit: Number(e.target.value) })} /></Field>
            <div className="flex items-center gap-2 mt-6">
              <input type="checkbox" id="approval" checked={form.expenseApprovalRequired} onChange={(e) => setForm({ ...form, expenseApprovalRequired: e.target.checked })} />
              <label htmlFor="approval" className="text-sm font-medium">Approval Required</label>
            </div>

            <h3 className="col-span-2 font-bold text-ink-900 border-b pb-2 mt-4">Management Permissions</h3>
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <Check label="Can Collect Rent" checked={form.canCollectRent} onChange={(v) => setForm({ ...form, canCollectRent: v })} />
              <Check label="Can Manage Tenants" checked={form.canManageTenants} onChange={(v) => setForm({ ...form, canManageTenants: v })} />
              <Check label="Can Handle Maintenance" checked={form.canHandleMaintenance} onChange={(v) => setForm({ ...form, canHandleMaintenance: v })} />
              <Check label="Can List Property" checked={form.canListProperty} onChange={(v) => setForm({ ...form, canListProperty: v })} />
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}

function Check({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
