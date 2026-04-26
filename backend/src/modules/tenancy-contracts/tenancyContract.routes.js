const router = require('express').Router();
const { z } = require('zod');
const { TenancyContract } = require('./tenancyContract.model');
const { Property } = require('../properties/property.model');
const rentService = require('../rent/rent.service');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

const schema = z.object({
  code: z.string().min(2),
  property: z.string().min(1),
  tenant: z.string().min(1),
  annualRent: z.number().min(0),
  paymentSchedule: z.enum(['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL']).optional(),
  securityDeposit: z.number().min(0).optional(),
  startDate: z.string(),
  endDate: z.string(),
  moveInDate: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED']).optional(),
  rules: z.string().optional(),
  penaltyTerms: z.string().optional(),
  notes: z.string().optional(),
});

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.tenant) filter.tenant = req.query.tenant;
  if (req.query.property) filter.property = req.query.property;
  const r = await paginate(TenancyContract, filter, req.query, {
    populate: [
      { path: 'property', select: 'code name location type' },
      { path: 'tenant', select: 'name email phone avatar' },
    ],
  });
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const c = await TenancyContract.findById(req.params.id)
    .populate('property')
    .populate('tenant')
    .lean();
  if (!c) throw ApiError.notFound('Contract not found');
  ok(res, c);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), validate(schema), async (req, res) => {
  const contract = await TenancyContract.create(req.body);
  if (contract.status === 'ACTIVE') {
    await rentService.generateInvoicesForContract(contract);
    await Property.findByIdAndUpdate(contract.property, { status: 'RENTED' });
  }
  created(res, contract);
});

router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), validate(schema.partial()), async (req, res) => {
  const c = await TenancyContract.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) throw ApiError.notFound('Contract not found');
  if (c.status === 'TERMINATED' || c.status === 'EXPIRED') {
    await Property.findByIdAndUpdate(c.property, { status: 'AVAILABLE' });
  }
  ok(res, c);
});

router.post('/:id/generate-invoices', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const c = await TenancyContract.findById(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  const count = await rentService.generateInvoicesForContract(c);
  ok(res, { generated: count });
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const c = await TenancyContract.findByIdAndDelete(req.params.id);
  if (!c) throw ApiError.notFound('Contract not found');
  noContent(res);
});

module.exports = router;
