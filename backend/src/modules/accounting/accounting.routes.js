const router = require('express').Router();
const { z } = require('zod');
const { GLEntry } = require('./glEntry.model');
const { OwnerStatement } = require('./ownerStatement.model');
const { Account } = require('./account.model');
const { FiscalYear } = require('./fiscalYear.model');
const service = require('./accounting.service');
const reports = require('./reports.service');
const journalEntryService = require('./journalEntry.service');
const { JE_TYPES } = require('./journal.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created } = require('../../shared/utils/response');

router.use(auth);

// ---------- Chart of Accounts ----------

router.get('/accounts', async (req, res) => {
  const flat = await Account.find().sort({ code: 1 }).lean();
  const tree = buildTree(flat);
  ok(res, { flat, tree });
});

function buildTree(flat) {
  const byId = new Map(flat.map((a) => [String(a._id), { ...a, children: [] }]));
  const roots = [];
  for (const a of byId.values()) {
    if (a.parent && byId.has(String(a.parent))) {
      byId.get(String(a.parent)).children.push(a);
    } else {
      roots.push(a);
    }
  }
  return roots;
}

router.get('/fiscal-years', async (_req, res) => {
  ok(res, await FiscalYear.find().sort({ name: -1 }).lean());
});

// ---------- General Ledger ----------

router.get('/general-ledger', async (req, res) => {
  ok(res, await reports.generalLedger(req.query));
});

// ---------- Trial balance ----------

router.get('/trial-balance', async (req, res) => {
  ok(res, await reports.trialBalance(req.query));
});

// ---------- P&L ----------

router.get('/pnl', async (req, res) => {
  if (req.query.property) {
    const r = await reports.profitAndLoss(req.query);
    ok(res, { propertyId: req.query.property, income: r.totalIncome, expense: r.totalExpense, profit: r.netProfit, breakdown: [...r.income, ...r.expense] });
  } else {
    const r = await reports.profitAndLoss(req.query);
    ok(res, {
      income: r.totalIncome,
      expense: r.totalExpense,
      commission: r.income.find((x) => x.code === '4200')?.net || 0,
      profit: r.netProfit,
      breakdown: [...r.income, ...r.expense],
      details: r,
    });
  }
});

// ---------- Balance Sheet ----------

router.get('/balance-sheet', async (req, res) => {
  ok(res, await reports.balanceSheet(req.query));
});

// ---------- Cash Flow ----------

router.get('/cash-flow', async (req, res) => {
  ok(res, await reports.cashFlow(req.query));
});

// ---------- Receivables Aging ----------

router.get('/aging', async (req, res) => {
  ok(res, await reports.receivablesAging(req.query));
});

// ---------- Property-wise P&L ----------

router.get('/property-pnl', async (req, res) => {
  ok(res, await reports.propertyPnl(req.query));
});

// ---------- Journal (legacy alias for the GL Entry list, voucher view) ----------

router.get('/journal', async (req, res) => {
  // Group GL entries by voucher to render document-style cards.
  const filter = { isCancelled: { $ne: true } };
  if (req.query.voucherType) filter.voucherType = req.query.voucherType;
  if (req.query.from || req.query.to) {
    filter.postingDate = {};
    if (req.query.from) filter.postingDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.postingDate.$lte = new Date(req.query.to);
  }

  const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
  const page = Math.max(1, parseInt(req.query.page || '1', 10));

  const groups = await GLEntry.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { voucherType: '$voucherType', voucherNo: '$voucherNo', voucherId: '$voucherId' },
        date: { $first: '$postingDate' },
        remarks: { $first: '$remarks' },
        lines: {
          $push: {
            account: '$account',
            accountName: '$accountName',
            debit: '$debit',
            credit: '$credit',
            party: '$party',
            partyName: '$partyName',
            property: '$property',
            remarks: '$remarks',
          },
        },
        totalDebit: { $sum: '$debit' },
        totalCredit: { $sum: '$credit' },
      },
    },
    { $sort: { date: -1, '_id.voucherNo': -1 } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  const items = groups.map((g) => ({
    _id: g._id.voucherId || g._id.voucherNo,
    number: g._id.voucherNo,
    type: g._id.voucherType,
    date: g.date,
    memo: g.remarks,
    lines: g.lines,
    totalDebit: g.totalDebit,
    totalCredit: g.totalCredit,
  }));

  ok(res, items, { page, limit, total: items.length });
});

// ---------- Manual Journal Entries (ERPNext-style) ----------

const jeLineSchema = z.object({
  accountCode: z.string().min(1),
  debit: z.number().min(0).default(0),
  credit: z.number().min(0).default(0),
  party: z.enum(['TENANT', 'OWNER']).nullable().optional(),
  partyId: z.string().nullable().optional(),
  partyName: z.string().optional(),
  property: z.string().nullable().optional(),
  remarks: z.string().optional(),
});

const jeCreateSchema = z.object({
  type: z.enum(JE_TYPES).optional(),
  postingDate: z.string().optional(),
  title: z.string().optional(),
  memo: z.string().optional(),
  lines: z.array(jeLineSchema).min(2),
});

router.get('/journal-entries', async (req, res) => {
  ok(res, await journalEntryService.list(req.query));
});

router.get('/journal-entries/:id', async (req, res) => {
  ok(res, await journalEntryService.get(req.params.id));
});

router.post(
  '/journal-entries',
  requireRole('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'),
  validate(jeCreateSchema),
  async (req, res) => {
    const je = await journalEntryService.create(req.body, req.user.id);
    created(res, je);
  }
);

router.post(
  '/journal-entries/:id/cancel',
  requireRole('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'),
  async (req, res) => {
    ok(res, await journalEntryService.cancel(req.params.id));
  }
);

// ---------- Owner statements ----------

router.get('/owner-statements', async (req, res) => {
  const filter = {};
  if (req.query.owner) filter.owner = req.query.owner;
  if (req.query.status) filter.status = req.query.status;
  const r = await paginate(OwnerStatement, filter, req.query, {
    populate: [
      { path: 'owner', select: 'name email phone' },
      { path: 'property', select: 'code name' },
    ],
  });
  ok(res, r.items, r.meta);
});

router.get('/owner-statements/:id', async (req, res) => {
  const s = await OwnerStatement.findById(req.params.id).populate('owner').populate('property').lean();
  ok(res, s);
});

const generateSchema = z.object({
  propertyId: z.string(),
  ownerId: z.string(),
  start: z.string(),
  end: z.string(),
  periodLabel: z.string().optional(),
});

router.post('/owner-statements', requireRole('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'), validate(generateSchema), async (req, res) => {
  const s = await service.generateOwnerStatement(req.body);
  created(res, s);
});

router.post('/owner-statements/:id/pay', requireRole('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'), async (req, res) => {
  const s = await service.payOwnerStatement(req.params.id, req.body);
  ok(res, s);
});

module.exports = router;
