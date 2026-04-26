/**
 * Public accounting facade.
 *
 * Other modules (rent, expenses, owner-statements) call into this file. It
 * delegates the actual ledger writes to `posting.service.js` and the actual
 * reporting math to `reports.service.js`.
 */

const { OwnerStatement } = require('./ownerStatement.model');
const { Account, ensureSystemAccounts } = require('./account.model');
const { ensureFiscalYearFor } = require('./fiscalYear.model');
const { GLEntry } = require('./glEntry.model');
const posting = require('./posting.service');
const reports = require('./reports.service');
const { Property } = require('../properties/property.model');
const { ManagementContract } = require('../management-contracts/managementContract.model');

// ---------------------------------------------------------------------------
// Document → ledger postings
// ---------------------------------------------------------------------------

/**
 * Post a Sales Invoice (rent / security deposit).
 *
 *   Dr  AR (party=Tenant)
 *   Cr  Rent Income      OR  Security Deposits Held
 */
async function postSalesInvoice(invoice, tenantName) {
  const isDeposit = invoice.type === 'SECURITY_DEPOSIT';
  const incomeAccount = isDeposit ? '2110' : '4100';
  const incomeName = isDeposit ? 'Security Deposits Held' : 'Rent Income';

  return posting.postEntries({
    postingDate: invoice.issueDate || invoice.createdAt || new Date(),
    voucherType: 'SALES_INVOICE',
    voucherNo: invoice.number,
    voucherId: invoice._id,
    remarks: `${isDeposit ? 'Security deposit' : 'Rent'} — ${invoice.period?.label || ''} (${invoice.number})`,
    lines: [
      {
        account: '1130',
        debit: invoice.amount,
        credit: 0,
        party: 'TENANT',
        partyId: invoice.tenant,
        partyName: tenantName,
        property: invoice.property,
        remarks: invoice.period?.label || invoice.type,
      },
      {
        account: incomeAccount,
        debit: 0,
        credit: invoice.amount,
        property: invoice.property,
        remarks: invoice.period?.label || incomeName,
      },
    ],
  });
}

/**
 * Post a Payment Entry (cash / bank receipt against an invoice).
 *
 *   Dr  Cash or Bank
 *   Cr  AR (party=Tenant)
 */
async function postPayment({ invoice, payment, tenantName }) {
  const cashAccount = payment.method === 'CASH' ? '1110' : '1120';
  return posting.postEntries({
    postingDate: payment.paidAt || new Date(),
    voucherType: 'PAYMENT_ENTRY',
    voucherNo: payment.number,
    voucherId: payment._id,
    remarks: `Payment ${payment.number} for ${invoice.number} via ${payment.method}`,
    lines: [
      {
        account: cashAccount,
        debit: payment.amount,
        credit: 0,
        property: invoice.property,
        remarks: `Receipt via ${payment.method}`,
      },
      {
        account: '1130',
        debit: 0,
        credit: payment.amount,
        party: 'TENANT',
        partyId: invoice.tenant,
        partyName: tenantName,
        property: invoice.property,
        remarks: `Knocks down AR for ${invoice.number}`,
      },
    ],
  });
}

/**
 * Post a Purchase Invoice / Expense.
 *
 *   Dr  Expense (5xxx)
 *   Cr  Cash or Bank
 */
async function postExpense(expense) {
  const cashAccount = expense.paidVia === 'CASH' ? '1110' : '1120';
  const expenseAccount = expense.accountCode || '5900';

  return posting.postEntries({
    postingDate: expense.date || new Date(),
    voucherType: 'PURCHASE_INVOICE',
    voucherNo: expense.number,
    voucherId: expense._id,
    remarks: `Expense ${expense.number}: ${expense.title || expense.category}`,
    lines: [
      {
        account: expenseAccount,
        debit: expense.amount,
        credit: 0,
        property: expense.property,
        remarks: expense.title,
      },
      {
        account: cashAccount,
        debit: 0,
        credit: expense.amount,
        property: expense.property,
        remarks: expense.title,
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// Owner Statement
// ---------------------------------------------------------------------------

async function nextStatementNumber() {
  const seq = (await OwnerStatement.countDocuments()) + 1;
  return `OS-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
}

/**
 * Generate (draft) owner statement by reading the GL.
 */
async function generateOwnerStatement({ propertyId, ownerId, start, end, periodLabel }) {
  const property = await Property.findById(propertyId).lean();
  if (!property) throw new Error('Property not found');

  const ownership = property.owners.find((o) => String(o.owner) === String(ownerId));
  const ownershipPct = ownership?.percentage || 100;

  const mgmt = await ManagementContract.findOne({
    property: propertyId,
    status: 'ACTIVE',
    startDate: { $lte: new Date(end || Date.now()) },
    endDate: { $gte: new Date(start || 0) },
  }).lean();

  const filter = {
    isCancelled: false,
    property: propertyId,
    rootType: { $in: ['INCOME', 'EXPENSE'] },
  };
  if (start || end) {
    filter.postingDate = {};
    if (start) filter.postingDate.$gte = new Date(start);
    if (end) filter.postingDate.$lte = new Date(end);
  }

  const entries = await GLEntry.find(filter).lean();
  const lines = [];
  let gross = 0;
  let expenses = 0;

  for (const e of entries) {
    if (e.account === '4100' && e.credit > 0) {
      gross += e.credit;
      lines.push({
        label: e.remarks || 'Rent income',
        type: 'INCOME',
        amount: e.credit,
        reference: e.voucherNo,
        date: e.postingDate,
      });
    }
    if (e.rootType === 'EXPENSE' && e.debit > 0) {
      expenses += e.debit;
      lines.push({
        label: e.remarks || e.accountName,
        type: 'EXPENSE',
        amount: e.debit,
        reference: e.voucherNo,
        date: e.postingDate,
      });
    }
  }

  gross = +(gross * (ownershipPct / 100)).toFixed(2);
  expenses = +(expenses * (ownershipPct / 100)).toFixed(2);

  const commissionPct = mgmt?.commissionPct ?? 5;
  const commission = +((gross * commissionPct) / 100).toFixed(2);
  const expensesBornBy = mgmt?.expensesBornBy || 'OWNER';
  const netPayout = +(gross - commission - (expensesBornBy === 'OWNER' ? expenses : 0)).toFixed(2);

  if (commission > 0) {
    lines.push({
      label: `Management commission ${commissionPct}%`,
      type: 'COMMISSION',
      amount: commission,
      reference: mgmt?.code || '',
      date: new Date(),
    });
  }

  const number = await nextStatementNumber();
  return OwnerStatement.create({
    number,
    owner: ownerId,
    property: propertyId,
    period: { label: periodLabel || `${start} → ${end}`, start, end },
    grossIncome: gross,
    totalExpenses: expenses,
    commission,
    netPayout,
    ownershipPct,
    lines,
    status: 'DRAFT',
  });
}

/**
 * Pay out a statement → 2 GL postings (commission recognition + bank payout).
 *
 *   1) Recognise commission (transfer from Owner-implicit pool to Commission Income)
 *      Dr Owner Payable (party=Owner)   commission
 *      Cr Commission Income             commission
 *
 *   2) Pay net to owner
 *      Dr Owner Payable (party=Owner)   netPayout
 *      Cr Bank                          netPayout
 *
 * NOTE: For pure double-entry sanity we'd accrue the owner's share at invoice
 * time. In MVP we simulate the same end-state with two postings here.
 */
async function payOwnerStatement(statementId, { method = 'BANK_TRANSFER', notes } = {}) {
  const stmt = await OwnerStatement.findById(statementId).populate('owner', 'name').lean();
  if (!stmt) throw new Error('Statement not found');
  if (stmt.status === 'PAID') throw new Error('Already paid');

  const today = new Date();
  const ownerName = stmt.owner?.name || 'Owner';

  // Leg 1 — commission recognition (only if non-zero)
  if (stmt.commission > 0) {
    await posting.postEntries({
      postingDate: today,
      voucherType: 'OWNER_SETTLEMENT',
      voucherNo: `${stmt.number}-COMM`,
      voucherId: stmt._id,
      remarks: `Commission for ${stmt.number}`,
      lines: [
        {
          account: '2120',
          debit: stmt.commission,
          credit: 0,
          party: 'OWNER',
          partyId: stmt.owner._id || stmt.owner,
          partyName: ownerName,
          property: stmt.property,
        },
        {
          account: '4200',
          debit: 0,
          credit: stmt.commission,
          property: stmt.property,
        },
      ],
    });
  }

  // Leg 2 — bank payout
  if (stmt.netPayout > 0) {
    await posting.postEntries({
      postingDate: today,
      voucherType: 'OWNER_SETTLEMENT',
      voucherNo: stmt.number,
      voucherId: stmt._id,
      remarks: `Owner payout ${stmt.number} via ${method}`,
      lines: [
        {
          account: '2120',
          debit: stmt.netPayout,
          credit: 0,
          party: 'OWNER',
          partyId: stmt.owner._id || stmt.owner,
          partyName: ownerName,
          property: stmt.property,
        },
        {
          account: method === 'CASH' ? '1110' : '1120',
          debit: 0,
          credit: stmt.netPayout,
          property: stmt.property,
        },
      ],
    });
  }

  return OwnerStatement.findByIdAndUpdate(
    statementId,
    { status: 'PAID', paidAt: today, paidMethod: method, notes },
    { new: true }
  );
}

// ---------------------------------------------------------------------------
// Reports passthrough (kept here so callers have one entry point)
// ---------------------------------------------------------------------------

async function trialBalance(...args) { return reports.trialBalance(...args); }
async function profitAndLoss(...args) { return reports.profitAndLoss(...args); }
async function generalLedger(...args) { return reports.generalLedger(...args); }
async function balanceSheet(...args) { return reports.balanceSheet(...args); }
async function cashFlow(...args) { return reports.cashFlow(...args); }
async function receivablesAging(...args) { return reports.receivablesAging(...args); }
async function propertyPnlReport(...args) { return reports.propertyPnl(...args); }

// ---------------------------------------------------------------------------
// Backwards-compat aliases (old shape used by dashboard module)
// ---------------------------------------------------------------------------

async function companyPnl(start, end) {
  const r = await reports.profitAndLoss({ from: start, to: end });
  return {
    income: r.totalIncome,
    expense: r.totalExpense,
    commission: r.income.find((x) => x.code === '4200')?.net || 0,
    profit: r.netProfit,
    breakdown: [...r.income, ...r.expense],
  };
}

async function propertyPnl(propertyId, start, end) {
  const r = await reports.profitAndLoss({ from: start, to: end, property: propertyId });
  return { propertyId, income: r.totalIncome, expense: r.totalExpense, profit: r.netProfit };
}

module.exports = {
  ensureSystemAccounts,
  // postings
  postSalesInvoice,
  postPayment,
  postExpense,
  // owner statement
  generateOwnerStatement,
  payOwnerStatement,
  // reports
  trialBalance,
  profitAndLoss,
  generalLedger,
  balanceSheet,
  cashFlow,
  receivablesAging,
  propertyPnlReport,
  // back-compat
  companyPnl,
  propertyPnl,
};
