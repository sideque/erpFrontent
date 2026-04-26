import { FormEvent, useState } from 'react';
import { Plus, FileSpreadsheet, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useOwnerStatements,
  useGenerateOwnerStatement,
  usePayOwnerStatement,
  useProperties,
  useOwners,
} from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { StatusBadge } from '@shared/ui/Badge';
import { Can, useCan } from '@shared/auth/useCan';
import { formatAed, formatDate } from '@shared/lib/format';

export function OwnerStatementsPage() {
  const canPayOut = useCan('ownerStatement.payOut');
  const { data } = useOwnerStatements({ limit: 100 });
  const generate = useGenerateOwnerStatement();
  const pay = usePayOwnerStatement();
  const { data: props } = useProperties({ limit: 200 });
  const { data: owners } = useOwners({ limit: 200 });
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    propertyId: '',
    ownerId: '',
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().slice(0, 10),
    end: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().slice(0, 10),
    periodLabel: '',
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await generate.mutateAsync(form);
      toast.success('Statement generated');
      setOpen(false);
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'num', header: 'Number', render: (s) => <span className="font-semibold">{s.number}</span> },
    { key: 'owner', header: 'Owner', render: (s) => <span>{s.owner?.name}</span> },
    { key: 'prop', header: 'Property', render: (s) => <span>{s.property?.name}</span> },
    { key: 'period', header: 'Period', render: (s) => <span>{s.period?.label}</span> },
    { key: 'gross', header: 'Gross', className: 'text-right', render: (s) => formatAed(s.grossIncome) },
    { key: 'exp', header: 'Expenses', className: 'text-right', render: (s) => <span className="text-rose-600">{formatAed(s.totalExpenses)}</span> },
    { key: 'comm', header: 'Commission', className: 'text-right', render: (s) => <span className="text-amber-600">{formatAed(s.commission)}</span> },
    { key: 'net', header: 'Net Payout', className: 'text-right', render: (s) => <span className="font-bold">{formatAed(s.netPayout)}</span> },
    { key: 'st', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
    { key: 'act', header: '', render: (s) => s.status !== 'PAID' && canPayOut && (
      <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={(e) => { e.stopPropagation(); setPicked(s); }}>Pay Out</button>
    ) },
  ];

  const payOut = async () => {
    try {
      await pay.mutateAsync({ id: picked._id });
      toast.success('Owner payout recorded. Posted to ledger.');
      setPicked(null);
    } catch {}
  };

  return (
    <>
      <PageHeader
        title="Owner Statements"
        breadcrumbs={[{ label: 'Home' }, { label: 'Accounting' }, { label: 'Owner Statements' }]}
        actions={
          <Can perm="ownerStatement.generate">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Generate Statement</button>
          </Can>
        }
      />

      <Card className="mb-6 bg-gradient-to-r from-brand-50 to-white">
        <CardHeader
          title="What is an Owner Statement?"
          icon={<FileSpreadsheet size={18} />}
          subtitle="An owner statement summarises rent collected, expenses paid, and management commission for a property in a given period — and computes the net payout to the owner."
        />
      </Card>

      <Table columns={cols} rows={data?.data || []} />

      <Modal open={open} onClose={() => setOpen(false)} title="Generate Owner Statement" subtitle="Computes gross income, expenses, commission and net payout for the selected period." width="max-w-lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="gen-form" className="btn-primary">Generate</button>
        </>
      }>
        <form id="gen-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <Field label="Property" required>
            <Select required value={form.propertyId} onChange={(e) => setForm({ ...form, propertyId: e.target.value })}>
              <option value="">— Select —</option>
              {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Owner" required>
            <Select required value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
              <option value="">— Select —</option>
              {owners?.data?.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
            </Select>
          </Field>
          <Field label="Period Start" required><Input type="date" required value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} /></Field>
          <Field label="Period End" required><Input type="date" required value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Period Label"><Input value={form.periodLabel} onChange={(e) => setForm({ ...form, periodLabel: e.target.value })} placeholder="e.g. November 2026" /></Field></div>
        </form>
      </Modal>

      <Modal open={!!picked} onClose={() => setPicked(null)} title={`Pay Out — ${picked?.number}`} width="max-w-md" footer={
        <>
          <button className="btn-secondary" onClick={() => setPicked(null)}>Cancel</button>
          <button className="btn-primary" onClick={payOut}><Wallet size={16} /> Confirm Payout</button>
        </>
      }>
        {picked && (
          <div className="space-y-3 text-sm">
            <Row label="Owner" value={picked.owner?.name} />
            <Row label="Property" value={picked.property?.name} />
            <Row label="Period" value={picked.period?.label} />
            <Row label="Gross income" value={formatAed(picked.grossIncome)} />
            <Row label="Expenses" value={formatAed(picked.totalExpenses)} tone="rose" />
            <Row label="Commission" value={formatAed(picked.commission)} tone="amber" />
            <div className="border-t border-line pt-3 flex items-center justify-between font-bold text-lg">
              <span>Net Payout</span>
              <span className="text-brand-700">{formatAed(picked.netPayout)}</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Row({ label, value, tone }: { label: string; value: any; tone?: 'rose' | 'amber' }) {
  return (
    <div className="flex justify-between"><span className="text-ink-500">{label}</span>
      <span className={tone === 'rose' ? 'text-rose-600 font-semibold' : tone === 'amber' ? 'text-amber-600 font-semibold' : 'font-semibold'}>{value}</span>
    </div>
  );
}
