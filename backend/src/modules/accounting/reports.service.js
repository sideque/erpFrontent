const { GLEntry } = require('./glEntry.model');
const { Account } = require('./account.model');

const round = (n) => Math.round(Number(n || 0) * 100) / 100;

function dateMatch(filter, q) {
  const out = { ...filter, isCancelled: false };
  if (q.from || q.to) {
    out.postingDate = {};
    if (q.from) out.postingDate.$gte = new Date(q.from);
    if (q.to) out.postingDate.$lte = new Date(q.to);
  }
  return out;
}

/**
 * General Ledger — every GL Entry, optionally filtered by account/party/property/date.
 * Returns rows + a running balance.
 */
async function generalLedger(query = {}) {
  const filter = dateMatch({}, query);
  if (query.account) filter.account = query.account;
  if (query.party) filter.party = query.party;
  if (query.partyId) filter.partyId = query.partyId;
  if (query.property) filter.property = query.property;
  if (query.voucherType) filter.voucherType = query.voucherType;

  const rows = await GLEntry.find(filter)
    .sort({ postingDate: 1, createdAt: 1 })
    .lean();

  // Running balance — meaningful only when filtered to a single account.
  let running = 0;
  const enriched = rows.map((r) => {
    const delta = r.debit - r.credit;
    running = round(running + delta);
    return { ...r, balance: running };
  });

  const totals = {
    debit: round(rows.reduce((s, r) => s + r.debit, 0)),
    credit: round(rows.reduce((s, r) => s + r.credit, 0)),
    closing: running,
  };

  return { rows: enriched, totals };
}

/**
 * Trial Balance — every account with its opening, debit, credit, closing.
 * (Opening = activity before `from`; for MVP we set opening = 0.)
 */
async function trialBalance(query = {}) {
  const filter = dateMatch({}, query);
  const agg = await GLEntry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$account',
        accountName: { $first: '$accountName' },
        rootType: { $first: '$rootType' },
        debit: { $sum: '$debit' },
        credit: { $sum: '$credit' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return agg.map((r) => ({
    code: r._id,
    name: r.accountName,
    rootType: r.rootType,
    debit: round(r.debit),
    credit: round(r.credit),
    balance: round(r.debit - r.credit),
  }));
}

/**
 * Profit & Loss — INCOME and EXPENSE accounts grouped, plus totals.
 */
async function profitAndLoss(query = {}) {
  const filter = dateMatch({ rootType: { $in: ['INCOME', 'EXPENSE'] } }, query);
  if (query.property) filter.property = query.property;

  const agg = await GLEntry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { code: '$account', name: '$accountName', rootType: '$rootType' },
        debit: { $sum: '$debit' },
        credit: { $sum: '$credit' },
      },
    },
    { $sort: { '_id.code': 1 } },
  ]);

  const income = [];
  const expense = [];
  for (const r of agg) {
    const row = {
      code: r._id.code,
      name: r._id.name,
      debit: round(r.debit),
      credit: round(r.credit),
      net: round(r._id.rootType === 'INCOME' ? r.credit - r.debit : r.debit - r.credit),
    };
    if (r._id.rootType === 'INCOME') income.push(row);
    else expense.push(row);
  }

  const totalIncome = round(income.reduce((s, r) => s + r.net, 0));
  const totalExpense = round(expense.reduce((s, r) => s + r.net, 0));
  return {
    income,
    expense,
    totalIncome,
    totalExpense,
    netProfit: round(totalIncome - totalExpense),
  };
}

/**
 * Balance Sheet — as-of a given date.
 * Returns Assets / Liabilities / Equity sections with grouped totals.
 *
 * Net profit (income - expense) up to the as-of date is included in equity
 * as "Current Year Earnings" so the sheet balances.
 */
async function balanceSheet(query = {}) {
  const asOf = query.asOf ? new Date(query.asOf) : new Date();
  const filter = { isCancelled: false, postingDate: { $lte: asOf } };

  const agg = await GLEntry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { code: '$account', name: '$accountName', rootType: '$rootType' },
        debit: { $sum: '$debit' },
        credit: { $sum: '$credit' },
      },
    },
    { $sort: { '_id.code': 1 } },
  ]);

  const assets = [];
  const liabilities = [];
  const equity = [];
  let income = 0;
  let expense = 0;

  for (const r of agg) {
    const balance = round(r.debit - r.credit);
    const row = { code: r._id.code, name: r._id.name, debit: round(r.debit), credit: round(r.credit), balance };
    switch (r._id.rootType) {
      case 'ASSET':
        assets.push(row);
        break;
      case 'LIABILITY':
        // Liabilities are normal-credit, so display as credit balance (positive)
        liabilities.push({ ...row, balance: round(r.credit - r.debit) });
        break;
      case 'EQUITY':
        equity.push({ ...row, balance: round(r.credit - r.debit) });
        break;
      case 'INCOME':
        income += r.credit - r.debit;
        break;
      case 'EXPENSE':
        expense += r.debit - r.credit;
        break;
    }
  }

  const currentYearEarnings = round(income - expense);
  if (currentYearEarnings !== 0) {
    equity.push({
      code: '3900',
      name: 'Current Year Earnings',
      debit: 0,
      credit: 0,
      balance: currentYearEarnings,
    });
  }

  const totalAssets = round(assets.reduce((s, r) => s + r.balance, 0));
  const totalLiabilities = round(liabilities.reduce((s, r) => s + r.balance, 0));
  const totalEquity = round(equity.reduce((s, r) => s + r.balance, 0));
  const balanced = round(totalAssets - (totalLiabilities + totalEquity));

  return {
    asOf,
    assets,
    liabilities,
    equity,
    totalAssets,
    totalLiabilities,
    totalEquity,
    totalLiabilitiesAndEquity: round(totalLiabilities + totalEquity),
    difference: balanced,
  };
}

/**
 * Cash Flow — movements on cash/bank accounts.
 */
async function cashFlow(query = {}) {
  const filter = dateMatch({ account: { $in: ['1110', '1120'] } }, query);
  const rows = await GLEntry.find(filter).sort({ postingDate: 1 }).lean();

  let inflow = 0;
  let outflow = 0;
  for (const r of rows) {
    inflow += r.debit;
    outflow += r.credit;
  }
  return {
    rows,
    inflow: round(inflow),
    outflow: round(outflow),
    net: round(inflow - outflow),
  };
}

/**
 * Receivables Aging — outstanding AR per tenant, bucketed by overdue days.
 *
 * Buckets: 0-30, 31-60, 61-90, 90+
 *
 * For each tenant we compute the AR balance (Σ debits − Σ credits where
 * party=TENANT, account=1130). Then we fetch their earliest unpaid invoice
 * to estimate aging — for MVP we use the oldest debit posting date.
 */
async function receivablesAging(query = {}) {
  const asOf = query.asOf ? new Date(query.asOf) : new Date();
  const agg = await GLEntry.aggregate([
    { $match: { isCancelled: false, account: '1130', party: 'TENANT', postingDate: { $lte: asOf } } },
    {
      $group: {
        _id: '$partyId',
        partyName: { $first: '$partyName' },
        debit: { $sum: '$debit' },
        credit: { $sum: '$credit' },
        firstDebit: { $min: { $cond: [{ $gt: ['$debit', 0] }, '$postingDate', null] } },
      },
    },
  ]);

  const out = [];
  for (const r of agg) {
    const outstanding = round(r.debit - r.credit);
    if (outstanding <= 0.01) continue;
    const ageDays = r.firstDebit ? Math.floor((asOf - new Date(r.firstDebit)) / (1000 * 60 * 60 * 24)) : 0;
    let bucket = '0-30';
    if (ageDays > 90) bucket = '90+';
    else if (ageDays > 60) bucket = '61-90';
    else if (ageDays > 30) bucket = '31-60';
    out.push({
      partyId: r._id,
      partyName: r.partyName,
      outstanding,
      ageDays,
      bucket,
    });
  }

  out.sort((a, b) => b.outstanding - a.outstanding);

  const totals = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 };
  for (const r of out) {
    totals[r.bucket] = round(totals[r.bucket] + r.outstanding);
    totals.total = round(totals.total + r.outstanding);
  }

  return { rows: out, totals, asOf };
}

/**
 * Property-wise P&L — group income/expense by property dimension.
 */
async function propertyPnl(query = {}) {
  const filter = dateMatch({ rootType: { $in: ['INCOME', 'EXPENSE'] } }, query);
  const agg = await GLEntry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { property: '$property', rootType: '$rootType' },
        amount: { $sum: { $cond: [{ $eq: ['$rootType', 'INCOME'] }, { $subtract: ['$credit', '$debit'] }, { $subtract: ['$debit', '$credit'] }] } },
      },
    },
  ]);

  const map = new Map();
  for (const r of agg) {
    const key = String(r._id.property || 'COMPANY');
    if (!map.has(key)) map.set(key, { property: r._id.property, income: 0, expense: 0 });
    if (r._id.rootType === 'INCOME') map.get(key).income = round(r.amount);
    else map.get(key).expense = round(r.amount);
  }
  return [...map.values()].map((r) => ({ ...r, profit: round(r.income - r.expense) }));
}

module.exports = {
  generalLedger,
  trialBalance,
  profitAndLoss,
  balanceSheet,
  cashFlow,
  receivablesAging,
  propertyPnl,
};
