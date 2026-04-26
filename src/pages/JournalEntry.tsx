import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, BookOpen, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Field, Input, Select, Textarea } from '@shared/ui/Field';
import { Badge } from '@shared/ui/Badge';
import {
  useChartOfAccounts,
  useCreateJournalEntry,
  useTenants,
  useOwners,
  useProperties,
} from '@entities/index';
import { formatAed } from '@shared/lib/format';
import { useNavigate } from 'react-router-dom';

interface Line {
  accountCode: string;
  debit: number;
  credit: number;
  party?: 'TENANT' | 'OWNER' | null;
  partyId?: string | null;
  partyName?: string;
  property?: string | null;
  remarks?: string;
}

const JE_TYPES = [
  { v: 'JOURNAL_ENTRY', l: 'Journal Entry' },
  { v: 'OPENING_ENTRY', l: 'Opening Entry' },
  { v: 'BANK_ENTRY', l: 'Bank Entry' },
  { v: 'CASH_ENTRY', l: 'Cash Entry' },
  { v: 'CREDIT_NOTE', l: 'Credit Note' },
  { v: 'DEBIT_NOTE', l: 'Debit Note' },
  { v: 'WRITE_OFF', l: 'Write Off' },
  { v: 'DEPRECIATION', l: 'Depreciation' },
];

const initialLines: Line[] = [
  { accountCode: '', debit: 0, credit: 0 },
  { accountCode: '', debit: 0, credit: 0 },
];

export function JournalEntry() {
  const navigate = useNavigate();
  const create = useCreateJournalEntry();
  const { data: coa } = useChartOfAccounts();
  const { data: tenants } = useTenants({ limit: 200 });
  const { data: owners } = useOwners({ limit: 200 });
  const { data: properties } = useProperties({ limit: 200 });

  const ledgerAccounts = (coa?.flat || []).filter((a: any) => !a.isGroup);
  const accountByCode = useMemo(
    () => new Map((coa?.flat || []).map((a: any) => [a.code, a])),
    [coa]
  );

  const [type, setType] = useState('JOURNAL_ENTRY');
  const [postingDate, setPostingDate] = useState(new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setType('JOURNAL_ENTRY');
    setPostingDate(new Date().toISOString().slice(0, 10));
    setTitle('');
    setMemo('');
    setLines(initialLines.map((l) => ({ ...l })));
  };

  const totals = lines.reduce(
    (acc, l) => ({ debit: acc.debit + Number(l.debit || 0), credit: acc.credit + Number(l.credit || 0) }),
    { debit: 0, credit: 0 }
  );
  const balanced = Math.abs(totals.debit - totals.credit) < 0.01 && totals.debit > 0;

  const lineErrors: Record<number, string> = {};
  const filledLines = lines.filter((l) => l.accountCode || l.debit > 0 || l.credit > 0);
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const filled = l.accountCode || l.debit > 0 || l.credit > 0;
    if (!filled) continue;
    if (!l.accountCode) { lineErrors[i] = 'Pick an account'; continue; }
    const acct = accountByCode.get(l.accountCode);
    if (!acct) { lineErrors[i] = 'Unknown account'; continue; }
    if (acct.isGroup) { lineErrors[i] = 'This is a group account — pick a leaf'; continue; }
    if (l.debit === 0 && l.credit === 0) { lineErrors[i] = 'Enter a debit or credit amount'; continue; }
    if (l.debit > 0 && l.credit > 0) { lineErrors[i] = 'Either debit or credit, not both'; continue; }
    if (acct.partyType && (!l.party || !l.partyId)) {
      lineErrors[i] = `${acct.partyType.toLowerCase()} required for ${acct.code}`;
      continue;
    }
  }

  const errorCount = Object.keys(lineErrors).length;
  const tooFew = filledLines.length < 2;

  const addLine = () => setLines((s) => [...s, { accountCode: '', debit: 0, credit: 0 }]);
  const removeLine = (i: number) => setLines((s) => (s.length <= 2 ? s : s.filter((_, idx) => idx !== i)));
  const updateLine = (i: number, patch: Partial<Line>) =>
    setLines((s) => s.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    if (submitting) return;
    if (tooFew) { toast.error('Add at least 2 filled lines (account + amount)'); return; }
    if (errorCount > 0) {
      const first = Object.entries(lineErrors)[0];
      toast.error(`Line ${Number(first[0]) + 1}: ${first[1]}`);
      return;
    }
    if (!balanced) {
      toast.error(`Unbalanced — debits ${formatAed(totals.debit)} ≠ credits ${formatAed(totals.credit)}`);
      return;
    }
    setSubmitting(true);
    try {
      const cleaned = filledLines.map((l) => ({
        accountCode: l.accountCode,
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0),
        ...(l.party ? { party: l.party } : {}),
        ...(l.partyId ? { partyId: l.partyId } : {}),
        ...(l.partyName ? { partyName: l.partyName } : {}),
        ...(l.property ? { property: l.property } : {}),
        ...(l.remarks ? { remarks: l.remarks } : {}),
      }));
      const je = await create.mutateAsync({ type, postingDate, title, memo, lines: cleaned });
      toast.success(`Posted ${je.number} · ${formatAed(je.totalDebit)}`);
      navigate(-1); // back to previous page
    } catch {
      // toast already shown by api client interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">New Journal Entry</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Record a manual ledger posting. Debits must equal credits.
          </p>
        </div>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>

      {/* Type / Date / Title */}
      <div className="grid grid-cols-3 gap-4">
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {JE_TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </Select>
        </Field>
        <Field label="Posting Date" required>
          <Input type="date" required value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
        </Field>
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Adjustment for AC repair miscoding" />
        </Field>
      </div>

      {/* Lines Table */}
      <div>
        <label className="label">Lines</label>
        <div className="rounded-xl border border-line overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-3 py-2 text-left">Account</th>
                <th className="px-3 py-2 text-left">Party</th>
                <th className="px-3 py-2 text-left">Property</th>
                <th className="px-3 py-2 text-right w-32">Debit</th>
                <th className="px-3 py-2 text-right w-32">Credit</th>
                <th className="px-3 py-2 text-left">Remarks</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lines.map((line, i) => {
                const account = accountByCode.get(line.accountCode);
                const requiresParty = account?.partyType as 'TENANT' | 'OWNER' | undefined;
                const err = lineErrors[i];
                return (
                  <tr key={i} className={`align-top ${err ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-3 py-2">
                      <select
                        className="select"
                        value={line.accountCode}
                        onChange={(e) => updateLine(i, { accountCode: e.target.value, party: null, partyId: null, partyName: '' })}
                      >
                        <option value="">— Select —</option>
                        {ledgerAccounts.map((a: any) => (
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                      </select>
                      {account?.rootType && (
                        <Badge tone="gray" className="mt-1">{account.rootType}</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {requiresParty === 'TENANT' && (
                        <select
                          className="select"
                          value={line.partyId || ''}
                          onChange={(e) => {
                            const t = (tenants?.data || []).find((x: any) => x._id === e.target.value);
                            updateLine(i, { party: 'TENANT', partyId: e.target.value || null, partyName: t?.name || '' });
                          }}
                        >
                          <option value="">— Tenant —</option>
                          {(tenants?.data || []).map((t: any) => (
                            <option key={t._id} value={t._id}>{t.name}</option>
                          ))}
                        </select>
                      )}
                      {requiresParty === 'OWNER' && (
                        <select
                          className="select"
                          value={line.partyId || ''}
                          onChange={(e) => {
                            const o = (owners?.data || []).find((x: any) => x._id === e.target.value);
                            updateLine(i, { party: 'OWNER', partyId: e.target.value || null, partyName: o?.name || '' });
                          }}
                        >
                          <option value="">— Owner —</option>
                          {(owners?.data || []).map((o: any) => (
                            <option key={o._id} value={o._id}>{o.name}</option>
                          ))}
                        </select>
                      )}
                      {!requiresParty && line.accountCode && <span className="text-xs text-ink-400">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        className="select"
                        value={line.property || ''}
                        onChange={(e) => updateLine(i, { property: e.target.value || null })}
                      >
                        <option value="">— None —</option>
                        {(properties?.data || []).map((p: any) => (
                          <option key={p._id} value={p._id}>{p.code}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number" step="0.01" min={0} className="input text-right"
                        value={line.debit || ''}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          updateLine(i, { debit: v, credit: v > 0 ? 0 : line.credit });
                        }}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number" step="0.01" min={0} className="input text-right"
                        value={line.credit || ''}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          updateLine(i, { credit: v, debit: v > 0 ? 0 : line.debit });
                        }}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="input" value={line.remarks || ''}
                        onChange={(e) => updateLine(i, { remarks: e.target.value })}
                        placeholder="Optional"
                      />
                      {err && (
                        <div className="mt-1 text-[11px] text-rose-600 font-medium flex items-center gap-1">
                          <AlertTriangle size={11} /> {err}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-rose-500 hover:text-rose-700 disabled:opacity-30"
                        onClick={() => removeLine(i)}
                        disabled={lines.length <= 2}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right font-bold">Totals</td>
                <td className="px-3 py-2 text-right font-bold">{formatAed(totals.debit)}</td>
                <td className="px-3 py-2 text-right font-bold">{formatAed(totals.credit)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-between items-center mt-2">
          <button type="button" className="btn-secondary" onClick={addLine}>
            <Plus size={14} /> Add line
          </button>
          <span className="text-xs text-ink-400">
            Tip: typing a debit auto-clears credit on the same line, and vice versa.
          </span>
        </div>
      </div>

      {/* Memo */}
      <Field label="Memo / Narration">
        <Textarea
          rows={2} value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Brief explanation of why this entry is needed (visible on the GL)"
        />
      </Field>

      {/* Footer Bar */}
      <div className="sticky bottom-0 bg-white border-t border-line py-4 flex items-center gap-4">
        <div className="mr-auto flex items-center gap-3 text-sm">
          <span className="text-ink-500">
            Total Dr <span className="font-bold text-ink-900">{formatAed(totals.debit)}</span>
          </span>
          <span className="text-ink-500">
            Total Cr <span className="font-bold text-ink-900">{formatAed(totals.credit)}</span>
          </span>
          {balanced ? (
            <Badge tone="green">Balanced</Badge>
          ) : (
            <Badge tone="red">Δ {formatAed(totals.debit - totals.credit)}</Badge>
          )}
          {errorCount > 0 && (
            <Badge tone="amber">
              <AlertTriangle size={12} /> {errorCount} issue{errorCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <button type="button" className="btn-secondary" onClick={reset}>Reset</button>
        <button type="button" className="btn-primary" disabled={submitting} onClick={submit}>
          <BookOpen size={16} /> {submitting ? 'Posting…' : 'Post Entry'}
        </button>
      </div>

    </div>
  );
}