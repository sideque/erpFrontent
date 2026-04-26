const router = require('express').Router();
const { z } = require('zod');
const { Expense, CATEGORY_ACCOUNT } = require('./expense.model');
const accounting = require('../accounting/accounting.service');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

const schema = z.object({
  title: z.string().min(2),
  category: z.enum(['MAINTENANCE', 'UTILITY', 'VENDOR', 'INSURANCE', 'TAX', 'OTHER']),
  property: z.string().optional(),
  vendor: z.string().optional(),
  amount: z.number().positive(),
  date: z.string().optional(),
  paidVia: z.enum(['CASH', 'BANK']).optional(),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
});

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.property) filter.property = req.query.property;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }
  const r = await paginate(Expense, filter, req.query, {
    sort: { date: -1 },
    populate: { path: 'property', select: 'code name' },
  });
  ok(res, r.items, r.meta);
});

router.get('/summary', async (_req, res) => {
  const agg = await Expense.aggregate([
    { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  const total = agg.reduce((s, x) => s + x.amount, 0);
  ok(res, { total, byCategory: agg });
});

router.get('/:id', async (req, res) => {
  const e = await Expense.findById(req.params.id).populate('property').lean();
  if (!e) throw ApiError.notFound('Expense not found');
  ok(res, e);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT'), validate(schema), async (req, res) => {
  const seq = (await Expense.countDocuments()) + 1;
  const acc = CATEGORY_ACCOUNT[req.body.category];
  const exp = await Expense.create({
    ...req.body,
    number: `EXP-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
    createdBy: req.user.id,
    accountCode: acc.code,
    accountName: acc.name,
  });
  await accounting.postExpense(exp);
  created(res, exp);
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const e = await Expense.findByIdAndDelete(req.params.id);
  if (!e) throw ApiError.notFound('Expense not found');
  noContent(res);
});

module.exports = router;
