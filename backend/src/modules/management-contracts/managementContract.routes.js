const router = require('express').Router();
const { z } = require('zod');
const { ManagementContract } = require('./managementContract.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

const schema = z.object({
  code: z.string().min(2),
  property: z.string().min(1),
  owners: z.array(z.string()).min(1),
  commissionPct: z.number().min(0).max(100),
  startDate: z.string(),
  endDate: z.string(),
  expensesBornBy: z.enum(['OWNER', 'COMPANY', 'SHARED']).optional(),
  incomeRule: z.enum(['NET_AFTER_EXPENSES', 'GROSS_LESS_COMMISSION']).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
  notes: z.string().optional(),
});

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.property) filter.property = req.query.property;
  if (req.query.owner) filter.owners = req.query.owner;
  const r = await paginate(ManagementContract, filter, req.query, {
    populate: [
      { path: 'property', select: 'code name type location' },
      { path: 'owners', select: 'name email phone' },
    ],
  });
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const c = await ManagementContract.findById(req.params.id)
    .populate('property')
    .populate('owners', 'name email phone')
    .lean();
  if (!c) throw ApiError.notFound('Contract not found');
  ok(res, c);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), validate(schema), async (req, res) => {
  created(res, await ManagementContract.create(req.body));
});

router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), validate(schema.partial()), async (req, res) => {
  const c = await ManagementContract.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) throw ApiError.notFound('Contract not found');
  ok(res, c);
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const c = await ManagementContract.findByIdAndDelete(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  noContent(res);
});

module.exports = router;
