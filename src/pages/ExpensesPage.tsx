import { FormEvent, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useExpenses, useCreateExpense, useExpenseSummary, useProperties } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card } from '@shared/ui/Card';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { Table, Column } from '@shared/ui/Table';
import { Badge } from '@shared/ui/Badge';
import { Can } from '@shared/auth/useCan';
import { KpiCard } from '@widgets/KpiCard';
import { formatAed, formatDate } from '@shared/lib/format';

const CATS = ['MAINTENANCE', 'UTILITY', 'VENDOR', 'INSURANCE', 'TAX', 'OTHER'];

export function ExpensesPage() {
  const [cat, setCat] = useState('');
  const [open, setOpen] = useState(false);
  const { data } = useExpenses({ category: cat, limit: 200 });
  const { data: summary } = useExpenseSummary();
  const { data: props } = useProperties({ limit: 200 });
  const create = useCreateExpense();
  const [form, setForm] = useState<any>({
    title: '',
    category: 'MAINTENANCE',
    property: '',
    vendor: '',
    amount: 0,
    paidVia: 'BANK',
    notes: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync({ ...form, amount: Number(form.amount), property: form.property || undefined });
      toast.success('Expense recorded. Posted to accounting.');
      setOpen(false);
      setForm({ ...form, title: '', amount: 0, vendor: '', notes: '' });
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'num', header: 'Number', render: (e) => <span className="font-semibold">{e.number}</span> },
    { key: 't', header: 'Title', render: (e) => <span>{e.title}</span> },
    { key: 'cat', header: 'Category', render: (e) => <Badge tone="purple">{e.category}</Badge> },
    { key: 'prop', header: 'Property', render: (e) => <span>{e.property?.name || '—'}</span> },
    { key: 'vendor', header: 'Vendor', render: (e) => <span>{e.vendor || '—'}</span> },
    { key: 'date', header: 'Date', render: (e) => formatDate(e.date) },
    { key: 'pay', header: 'Paid Via', render: (e) => <Badge tone="gray">{e.paidVia}</Badge> },
    { key: 'amt', header: 'Amount', className: 'text-right', render: (e) => <span className="font-semibold text-rose-600">{formatAed(e.amount)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Expenses"
        breadcrumbs={[{ label: 'Home' }, { label: 'Expenses' }]}
        actions={
          <Can perm="expense.create">
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Expense</button>
          </Can>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Total Expenses" value={formatAed(summary?.total || 0)} tone="rose" />
        {(summary?.byCategory || []).slice(0, 3).map((c: any) => (
          <KpiCard key={c._id} label={c._id} value={formatAed(c.amount)} hint={`${c.count} entries`} tone="brand" />
        ))}
      </div>

      <Card className="!p-4 mb-4 flex items-center gap-3">
        <select className="select w-44" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Card>

      <Table columns={cols} rows={data?.data || []} />

      <Modal open={open} onClose={() => setOpen(false)} title="Record Expense" subtitle="This entry will post a journal entry to the ledger." width="max-w-lg" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="exp-form" className="btn-primary">Record</button>
        </>
      }>
        <form id="exp-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Title" required><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="AC repair – chiller fan" /></Field></div>
          <Field label="Category" required>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Amount (AED)" required><Input type="number" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="Property (optional)">
            <Select value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">— Company-wide —</option>
              {props?.data?.map((p) => <option key={p._id} value={p._id}>{p.code} — {p.name}</option>)}
            </Select>
          </Field>
          <Field label="Paid Via">
            <Select value={form.paidVia} onChange={(e) => setForm({ ...form, paidVia: e.target.value })}>
              <option value="BANK">Bank</option><option value="CASH">Cash</option>
            </Select>
          </Field>
          <Field label="Vendor"><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <div className="col-span-2"><Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
        </form>
      </Modal>
    </>
  );
}
