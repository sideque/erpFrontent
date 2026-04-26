import { FormEvent, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { usePayInvoice } from '@entities/index';
import { formatAed } from '@shared/lib/format';

export function CollectRentModal({
  invoice,
  open,
  onClose,
}: {
  invoice: any | null;
  open: boolean;
  onClose: () => void;
}) {
  const pay = usePayInvoice();
  const [form, setForm] = useState<any>({ amount: 0, method: 'BANK_TRANSFER', reference: '', notes: '' });

  useEffect(() => {
    if (invoice) {
      setForm({
        amount: Math.max(0, invoice.amount - invoice.paidAmount),
        method: 'BANK_TRANSFER',
        reference: '',
        notes: '',
      });
    }
  }, [invoice]);

  if (!invoice) return null;
  const balance = invoice.amount - invoice.paidAmount;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await pay.mutateAsync({ id: invoice._id, payload: { ...form, amount: Number(form.amount) } });
      toast.success('Payment recorded. Accounting updated.');
      onClose();
    } catch {}
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Collect Payment — ${invoice.number}`}
      subtitle={`${invoice.tenant?.name || ''} · ${invoice.property?.name || ''}`}
      width="max-w-lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button form="pay-form" className="btn-primary">Record Payment</button>
        </>
      }
    >
      <div className="rounded-xl border border-line bg-slate-50 p-4 mb-4 grid grid-cols-3 text-center">
        <div><div className="text-xs text-ink-500">Invoice</div><div className="font-bold text-lg">{formatAed(invoice.amount)}</div></div>
        <div><div className="text-xs text-ink-500">Paid</div><div className="font-bold text-lg text-emerald-600">{formatAed(invoice.paidAmount)}</div></div>
        <div><div className="text-xs text-ink-500">Balance</div><div className="font-bold text-lg text-rose-600">{formatAed(balance)}</div></div>
      </div>

      <form id="pay-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Field label="Amount (AED)" required>
          <Input type="number" required min={1} max={balance} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </Field>
        <Field label="Method">
          <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
            <option value="MOCK_GATEWAY">Mock Gateway</option>
          </Select>
        </Field>
        <div className="col-span-2"><Field label="Reference / Cheque #"><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. EMI-12345 / CHQ-009" /></Field></div>
        <div className="col-span-2"><Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
      </form>
    </Modal>
  );
}
