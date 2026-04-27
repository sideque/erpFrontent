import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  BookOpen,
  ListTree,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useTrialBalance,
  usePnL,
  useJournal,
  useBalanceSheet,
  useReceivablesAging,
  useGeneralLedger,
  useChartOfAccounts,
  useJournalEntries,
  useCancelJournalEntry,
} from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Badge } from '@shared/ui/Badge';
import { KpiCard } from '@widgets/KpiCard';
import { Can, useCan } from '@shared/auth/useCan';
import { formatAed, formatDate } from '@shared/lib/format';
import { CreateJournalEntryModal } from '@features/accounting/CreateJournalEntryModal';

type Tab = 'PNL' | 'BS' | 'TB' | 'GL' | 'AGING' | 'COA' | 'JE' | 'JOURNAL';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'PNL', label: 'Profit & Loss', icon: TrendingUp },
  { key: 'BS', label: 'Balance Sheet', icon: Layers },
  { key: 'TB', label: 'Trial Balance', icon: BookOpen },
  { key: 'GL', label: 'General Ledger', icon: ListTree },
  { key: 'AGING', label: 'Receivables Aging', icon: AlertTriangle },
  { key: 'COA', label: 'Chart of Accounts', icon: FileSpreadsheet },
  { key: 'JE', label: 'Journal Entries', icon: BookOpen },
  { key: 'JOURNAL', label: 'All Vouchers', icon: BookOpen },
];

export function AccountingPage() {
  const [tab, setTab] = useState<Tab>('PNL');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: pnl } = usePnL();
  const canCreateJE = useCan('accounting.journal.create');
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Accounting"
        breadcrumbs={[{ label: 'Home' }, { label: 'Accounting' }]}
        actions={
          <>
            <Can perm="accounting.journal.create">
              <button className="btn-secondary" onClick={() => navigate("/accounting/journal-entry")}>
                <Plus size={16} /> New Journal Entry
              </button>
            </Can>
            <Link to="/accounting/owner-statements" className="btn-primary">
              <FileSpreadsheet size={16} /> Owner Statements
            </Link>
          </>
        }
      />

      <CreateJournalEntryModal open={createOpen} onClose={() => setCreateOpen(false)} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Rent Income" value={formatAed(pnl?.income || 0)} icon={<TrendingUp size={18} />} tone="green" />
        <KpiCard label="Commission" value={formatAed(pnl?.commission || 0)} tone="brand" />
        <KpiCard label="Expenses" value={formatAed(pnl?.expense || 0)} tone="rose" />
        <KpiCard label="Net Profit" value={formatAed(pnl?.profit || 0)} tone="amber" />
      </div>

      <div className="card !p-2 mb-4 flex flex-wrap gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition ${
                active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-slate-50'
              }`}
            >
              <Icon size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'PNL' && <PnLTab />}
      {tab === 'BS' && <BalanceSheetTab />}
      {tab === 'TB' && <TrialBalanceTab />}
      {tab === 'GL' && <GeneralLedgerTab />}
      {tab === 'AGING' && <AgingTab />}
      {tab === 'COA' && <ChartOfAccountsTab />}
      {tab === 'JE' && <JournalEntriesTab onNew={() => setCreateOpen(true)} canCreate={canCreateJE} />}
      {tab === 'JOURNAL' && <JournalTab />}
    </>
  );
}

// -----------------------------------------------------------------------------
// P&L
// -----------------------------------------------------------------------------

function PnLTab() {
  const { data: pnl } = usePnL();
  const breakdown = pnl?.breakdown || [];
  const incomeRows = breakdown.filter((b: any) => b.code?.startsWith('4'));
  const expenseRows = breakdown.filter((b: any) => b.code?.startsWith('5'));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader title="Income" icon={<TrendingUp size={18} />} />
        <Section rows={incomeRows} total={pnl?.income || 0} totalLabel="Total Income" tone="green" />
      </Card>
      <Card>
        <CardHeader title="Expense" icon={<TrendingUp size={18} />} />
        <Section rows={expenseRows} total={pnl?.expense || 0} totalLabel="Total Expense" tone="rose" />
      </Card>
      <Card className="lg:col-span-2 bg-gradient-to-r from-brand-50 to-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-500 font-semibold uppercase tracking-wider">Net Profit</div>
            <div className={`text-3xl font-bold mt-1 ${(pnl?.profit || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatAed(pnl?.profit || 0)}
            </div>
          </div>
          <div className="text-right text-sm text-ink-500">
            Income {formatAed(pnl?.income || 0)} − Expense {formatAed(pnl?.expense || 0)}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Section({ rows, total, totalLabel, tone }: { rows: any[]; total: number; totalLabel: string; tone: 'green' | 'rose' }) {
  return (
    <div>
      <table className="min-w-full">
        <thead><tr>
          <th className="px-2 py-2 text-left table-header">Code</th>
          <th className="px-2 py-2 text-left table-header">Account</th>
          <th className="px-2 py-2 text-right table-header">Amount</th>
        </tr></thead>
        <tbody className="divide-y divide-line text-sm">
          {rows.map((r) => (
            <tr key={r.code}>
              <td className="px-2 py-2.5 font-mono text-xs">{r.code}</td>
              <td className="px-2 py-2.5">{r.name}</td>
              <td className="px-2 py-2.5 text-right font-semibold">{formatAed(r.net || 0)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={3} className="px-2 py-6 text-center text-ink-400 text-sm">No entries</td></tr>
          )}
        </tbody>
        <tfoot>
          <tr className={`border-t-2 ${tone === 'green' ? 'border-emerald-200' : 'border-rose-200'}`}>
            <td className="px-2 py-3 font-bold" colSpan={2}>{totalLabel}</td>
            <td className={`px-2 py-3 text-right font-bold ${tone === 'green' ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatAed(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Balance Sheet
// -----------------------------------------------------------------------------

function BalanceSheetTab() {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const { data } = useBalanceSheet({ asOf });

  return (
    <>
      <Card className="!p-4 mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-ink-600">As of</label>
        <input type="date" className="input w-44" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
        {data && <Badge tone={Math.abs(data.difference) < 0.01 ? 'green' : 'red'}>
          {Math.abs(data.difference) < 0.01 ? 'Balanced' : `Out of balance by ${formatAed(data.difference)}`}
        </Badge>}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Assets" icon={<Layers size={18} />} />
          <BSGroup rows={data?.assets || []} />
          <Footer label="Total Assets" amount={data?.totalAssets || 0} tone="green" />
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Liabilities" />
            <BSGroup rows={data?.liabilities || []} />
            <Footer label="Total Liabilities" amount={data?.totalLiabilities || 0} tone="amber" />
          </Card>
          <Card>
            <CardHeader title="Equity" />
            <BSGroup rows={data?.equity || []} />
            <Footer label="Total Equity" amount={data?.totalEquity || 0} tone="brand" />
          </Card>
          <Card className="bg-slate-50">
            <Footer label="Total Liabilities + Equity" amount={data?.totalLiabilitiesAndEquity || 0} tone="brand" />
          </Card>
        </div>
      </div>
    </>
  );
}

function BSGroup({ rows }: { rows: any[] }) {
  return (
    <table className="min-w-full">
      <tbody className="divide-y divide-line text-sm">
        {rows.map((r) => (
          <tr key={r.code}>
            <td className="px-2 py-2.5 font-mono text-xs text-ink-500 w-16">{r.code}</td>
            <td className="px-2 py-2.5">{r.name}</td>
            <td className="px-2 py-2.5 text-right font-semibold">{formatAed(r.balance)}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={3} className="px-2 py-4 text-center text-ink-400">—</td></tr>}
      </tbody>
    </table>
  );
}

function Footer({ label, amount, tone }: { label: string; amount: number; tone: 'green' | 'rose' | 'brand' | 'amber' }) {
  const c = { green: 'text-emerald-700', rose: 'text-rose-600', brand: 'text-brand-700', amber: 'text-amber-600' }[tone];
  return (
    <div className={`mt-2 pt-3 border-t-2 border-${tone === 'brand' ? 'brand' : tone}-100 flex items-center justify-between`}>
      <span className="font-bold">{label}</span>
      <span className={`text-lg font-bold ${c}`}>{formatAed(amount)}</span>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Trial Balance
// -----------------------------------------------------------------------------

function TrialBalanceTab() {
  const { data } = useTrialBalance();
  const totals = (data || []).reduce((acc: any, r: any) => ({ debit: acc.debit + r.debit, credit: acc.credit + r.credit }), { debit: 0, credit: 0 });
  return (
    <Card>
      <CardHeader
        title="Trial Balance"
        icon={<BookOpen size={18} />}
        action={
          <Badge tone={Math.abs(totals.debit - totals.credit) < 0.01 ? 'green' : 'red'}>
            {Math.abs(totals.debit - totals.credit) < 0.01 ? 'Balanced' : `Δ ${formatAed(totals.debit - totals.credit)}`}
          </Badge>
        }
      />
      <table className="min-w-full">
        <thead><tr>
          <th className="px-3 py-2 text-left table-header">Code</th>
          <th className="px-3 py-2 text-left table-header">Account</th>
          <th className="px-3 py-2 text-left table-header">Type</th>
          <th className="px-3 py-2 text-right table-header">Debit</th>
          <th className="px-3 py-2 text-right table-header">Credit</th>
          <th className="px-3 py-2 text-right table-header">Balance</th>
        </tr></thead>
        <tbody className="divide-y divide-line text-sm">
          {(data || []).map((r: any) => (
            <tr key={r.code}>
              <td className="px-3 py-2.5 font-mono text-xs">{r.code}</td>
              <td className="px-3 py-2.5">{r.name}</td>
              <td className="px-3 py-2.5"><Badge tone={rootTypeTone(r.rootType)}>{r.rootType}</Badge></td>
              <td className="px-3 py-2.5 text-right">{formatAed(r.debit)}</td>
              <td className="px-3 py-2.5 text-right">{formatAed(r.credit)}</td>
              <td className={`px-3 py-2.5 text-right font-semibold ${r.balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{formatAed(r.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line">
            <td className="px-3 py-3 font-bold" colSpan={3}>Totals</td>
            <td className="px-3 py-3 text-right font-bold">{formatAed(totals.debit)}</td>
            <td className="px-3 py-3 text-right font-bold">{formatAed(totals.credit)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

function rootTypeTone(t: string): any {
  return { ASSET: 'blue', LIABILITY: 'amber', EQUITY: 'purple', INCOME: 'green', EXPENSE: 'red' }[t] || 'gray';
}

// -----------------------------------------------------------------------------
// General Ledger
// -----------------------------------------------------------------------------

function GeneralLedgerTab() {
  const { data: coa } = useChartOfAccounts();
  const ledgers = (coa?.flat || []).filter((a: any) => !a.isGroup);
  const [account, setAccount] = useState('1130');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { data } = useGeneralLedger({ account, from, to });
  return (
    <>
      <Card className="!p-4 mb-4 flex flex-wrap items-center gap-3">
        <select className="select w-72" value={account} onChange={(e) => setAccount(e.target.value)}>
          {ledgers.map((a: any) => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
        </select>
        <input type="date" className="input w-44" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From" />
        <input type="date" className="input w-44" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To" />
      </Card>

      <Card>
        <CardHeader
          title={`General Ledger — ${account}`}
          subtitle={`${data?.rows?.length || 0} entries · Closing balance ${formatAed(data?.totals?.closing || 0)}`}
        />
        <table className="min-w-full">
          <thead><tr>
            <th className="px-3 py-2 text-left table-header">Date</th>
            <th className="px-3 py-2 text-left table-header">Voucher</th>
            <th className="px-3 py-2 text-left table-header">Party</th>
            <th className="px-3 py-2 text-left table-header">Against</th>
            <th className="px-3 py-2 text-right table-header">Debit</th>
            <th className="px-3 py-2 text-right table-header">Credit</th>
            <th className="px-3 py-2 text-right table-header">Balance</th>
          </tr></thead>
          <tbody className="divide-y divide-line text-sm">
            {(data?.rows || []).map((r: any) => (
              <tr key={r._id}>
                <td className="px-3 py-2.5">{formatDate(r.postingDate)}</td>
                <td className="px-3 py-2.5">
                  <div className="font-semibold">{r.voucherNo}</div>
                  <div className="text-xs text-ink-500">{r.voucherType.replaceAll('_', ' ')}</div>
                </td>
                <td className="px-3 py-2.5">{r.partyName || '—'}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-ink-500">{r.againstAccounts}</td>
                <td className="px-3 py-2.5 text-right">{r.debit ? formatAed(r.debit) : '—'}</td>
                <td className="px-3 py-2.5 text-right">{r.credit ? formatAed(r.credit) : '—'}</td>
                <td className={`px-3 py-2.5 text-right font-semibold ${r.balance >= 0 ? 'text-ink-900' : 'text-rose-600'}`}>{formatAed(r.balance)}</td>
              </tr>
            ))}
            {(!data?.rows || data.rows.length === 0) && (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-ink-400">No entries.</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line">
              <td colSpan={4} className="px-3 py-3 font-bold">Totals</td>
              <td className="px-3 py-3 text-right font-bold">{formatAed(data?.totals?.debit || 0)}</td>
              <td className="px-3 py-3 text-right font-bold">{formatAed(data?.totals?.credit || 0)}</td>
              <td className="px-3 py-3 text-right font-bold text-brand-700">{formatAed(data?.totals?.closing || 0)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>
    </>
  );
}

// -----------------------------------------------------------------------------
// Aging
// -----------------------------------------------------------------------------

function AgingTab() {
  const { data } = useReceivablesAging();
  const buckets = ['0-30', '31-60', '61-90', '90+'] as const;
  const totals = data?.totals || {};
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Card className="bg-brand-50/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">Total Outstanding</div>
          <div className="text-2xl font-bold mt-1 text-brand-700">{formatAed(totals.total || 0)}</div>
        </Card>
        {buckets.map((b) => (
          <Card key={b}>
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">{b} days</div>
            <div className={`text-xl font-bold mt-1 ${b === '90+' ? 'text-rose-600' : 'text-ink-900'}`}>{formatAed(totals[b] || 0)}</div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Receivables Aging — by tenant" icon={<AlertTriangle size={18} />} />
        <table className="min-w-full">
          <thead><tr>
            <th className="px-3 py-2 text-left table-header">Tenant</th>
            <th className="px-3 py-2 text-right table-header">Outstanding</th>
            <th className="px-3 py-2 text-right table-header">Aged (days)</th>
            <th className="px-3 py-2 text-left table-header">Bucket</th>
          </tr></thead>
          <tbody className="divide-y divide-line text-sm">
            {(data?.rows || []).map((r: any) => (
              <tr key={r.partyId}>
                <td className="px-3 py-2.5 font-medium">{r.partyName}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{formatAed(r.outstanding)}</td>
                <td className="px-3 py-2.5 text-right">{r.ageDays}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={r.bucket === '90+' ? 'red' : r.bucket === '61-90' ? 'amber' : 'gray'}>{r.bucket}</Badge>
                </td>
              </tr>
            ))}
            {(!data?.rows || data.rows.length === 0) && (
              <tr><td colSpan={4} className="px-3 py-10 text-center text-emerald-600 font-semibold">All tenants are settled 🎉</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// -----------------------------------------------------------------------------
// Chart of Accounts (tree)
// -----------------------------------------------------------------------------

function ChartOfAccountsTab() {
  const { data } = useChartOfAccounts();
  return (
    <Card>
      <CardHeader
        title="Chart of Accounts"
        icon={<FileSpreadsheet size={18} />}
        subtitle="Hierarchical accounts. Group nodes are organisational; only ledger leaves are postable."
      />
      <div className="space-y-1">
        {(data?.tree || []).map((root: any) => <Node key={root.code} a={root} depth={0} />)}
      </div>
    </Card>
  );
}

function Node({ a, depth }: { a: any; depth: number }) {
  return (
    <>
      <div
        className={`flex items-center justify-between rounded-lg px-3 py-2 ${
          a.isGroup ? 'bg-slate-50 font-semibold text-ink-900' : 'hover:bg-slate-50'
        }`}
        style={{ marginLeft: depth * 16 }}
      >
        <div className="flex items-center gap-2">
          {a.isGroup && <ChevronRight size={14} className="text-ink-400" />}
          <span className="font-mono text-xs text-ink-500 w-12">{a.code}</span>
          <span>{a.name}</span>
          {a.partyType && <Badge tone="purple">party: {a.partyType}</Badge>}
        </div>
        <Badge tone={rootTypeTone(a.rootType)}>{a.rootType}</Badge>
      </div>
      {(a.children || []).map((c: any) => <Node key={c.code} a={c} depth={depth + 1} />)}
    </>
  );
}

// -----------------------------------------------------------------------------
// Manual Journal Entries (ERPNext-style document list)
// -----------------------------------------------------------------------------

function JournalEntriesTab({ onNew, canCreate }: { onNew: () => void; canCreate: boolean }) {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useJournalEntries({ type, status });
  const cancel = useCancelJournalEntry();
  const navigate = useNavigate();

  const onCancel = async (id: string, num: string) => {
    if (!confirm(`Cancel ${num}? A reversing entry will be posted to the ledger.`)) return;
    try {
      await cancel.mutateAsync(id);
      toast.success(`${num} cancelled — reversal posted`);
    } catch {}
  };

  return (
    <>
      <Card className="!p-4 mb-4 flex flex-wrap items-center gap-3">
        <select className="select w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="JOURNAL_ENTRY">Journal Entry</option>
          <option value="OPENING_ENTRY">Opening Entry</option>
          <option value="BANK_ENTRY">Bank Entry</option>
          <option value="CASH_ENTRY">Cash Entry</option>
          <option value="CREDIT_NOTE">Credit Note</option>
          <option value="DEBIT_NOTE">Debit Note</option>
          <option value="WRITE_OFF">Write Off</option>
          <option value="DEPRECIATION">Depreciation</option>
        </select>
        <select className="select w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          <option value="POSTED">Posted</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        {canCreate && (
          <button className="btn-primary ml-auto" onClick={() => navigate("/accounting/journal-entry")}>
            <Plus size={16} /> New Journal Entry
          </button> 
        )}
      </Card>

      <Card>
        <CardHeader
          title="Manual Journal Entries"
          icon={<BookOpen size={18} />}
          subtitle="ERPNext-style document for adjustments, depreciation, opening balances, etc. Each posted JE writes balanced GL entries."
        />
        <table className="min-w-full">
          <thead><tr>
            <th className="px-3 py-2 text-left table-header">Number</th>
            <th className="px-3 py-2 text-left table-header">Type</th> 
            <th className="px-3 py-2 text-left table-header">Date</th>
            <th className="px-3 py-2 text-left table-header">Title / Memo</th>
            <th className="px-3 py-2 text-right table-header">Total</th>
            <th className="px-3 py-2 text-left table-header">Status</th>
            <th className="px-3 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-line text-sm">
            {isLoading && <tr><td colSpan={7} className="px-3 py-10 text-center text-ink-400">Loading…</td></tr>}
            {!isLoading && (data || []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center">
                  <div className="text-ink-500 mb-3">No manual journal entries yet.</div>
                  {canCreate && (
                    <button className="btn-primary mx-auto" onClick={onNew}>
                      <Plus size={16} /> Create your first journal entry
                    </button>
                  )}
                </td>
              </tr>
            )}
            {(data || []).map((j: any) => (
              <tr key={j._id}>
                <td className="px-3 py-2.5 font-semibold text-brand-700">{j.number}</td>
                <td className="px-3 py-2.5"><Badge tone="purple">{j.type.replaceAll('_', ' ')}</Badge></td>
                <td className="px-3 py-2.5">{formatDate(j.postingDate)}</td>
                <td className="px-3 py-2.5">
                  <div className="font-medium">{j.title || '—'}</div>
                  {j.memo && <div className="text-xs text-ink-500 mt-0.5 line-clamp-1">{j.memo}</div>}
                </td>
                <td className="px-3 py-2.5 text-right font-bold">{formatAed(j.totalDebit)}</td>
                <td className="px-3 py-2.5">
                  <Badge tone={j.status === 'POSTED' ? 'green' : j.status === 'CANCELLED' ? 'red' : 'amber'}>
                    {j.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-right">
                  {j.status === 'POSTED' && (
                    <Can perm="accounting.journal.cancel">
                      <button
                        className="text-rose-600 hover:bg-rose-50 px-2 py-1 rounded inline-flex items-center gap-1 text-xs font-semibold"
                        onClick={() => onCancel(j._id, j.number)}
                      >
                        <X size={14} /> Cancel
                      </button>
                    </Can>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

// -----------------------------------------------------------------------------
// Journal (voucher view)
// -----------------------------------------------------------------------------

function JournalTab() {
  const { data: journal } = useJournal({ limit: 50 });
  return (
    <Card>
      <CardHeader title="General Journal" icon={<BookOpen size={18} />} subtitle="Every posted voucher with its underlying GL Entries" />
      <div className="space-y-4">
        {(journal?.data || []).map((j: any) => (
          <div key={j._id + j.number} className="rounded-xl border border-line p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold">{j.number}</span>
                <Badge tone="purple">{j.type.replaceAll('_', ' ')}</Badge>
                <span className="text-xs text-ink-500">{formatDate(j.date)}</span>
              </div>
              <div className="text-xs text-ink-500">D {formatAed(j.totalDebit)} = C {formatAed(j.totalCredit)}</div>
            </div>
            <p className="text-sm text-ink-600 mt-1">{j.memo}</p>
            <table className="min-w-full mt-3">
              <thead><tr>
                <th className="px-2 py-1.5 text-left table-header">Account</th>
                <th className="px-2 py-1.5 text-left table-header">Party</th>
                <th className="px-2 py-1.5 text-right table-header">Debit</th>
                <th className="px-2 py-1.5 text-right table-header">Credit</th>
              </tr></thead>
              <tbody className="text-sm">
                {j.lines.map((l: any, i: number) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1.5">
                      <span className="font-mono text-xs text-ink-500">{l.account}</span> {l.accountName}
                    </td>
                    <td className="px-2 py-1.5">{l.partyName || '—'}</td>
                    <td className="px-2 py-1.5 text-right">{l.debit ? formatAed(l.debit) : '—'}</td>
                    <td className="px-2 py-1.5 text-right">{l.credit ? formatAed(l.credit) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {(!journal?.data || journal.data.length === 0) && (
          <p className="text-center text-ink-500 py-10">No journal entries yet.</p>
        )}
      </div>
    </Card>
  );
}
