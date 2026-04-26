const router = require('express').Router();
const { z } = require('zod');
const { Tenant } = require('./tenant.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  employer: z.string().optional(),
  idType: z.enum(['EMIRATES_ID', 'PASSPORT']).optional(),
  idNumber: z.string().optional(),
  idImage: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  notes: z.string().optional(),
  blacklisted: z.boolean().optional(),
  blacklistReason: z.string().optional(),
  riskTag: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
});

const updateSchema = createSchema.partial();

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.q) filter.$or = [
    { name: new RegExp(req.query.q, 'i') },
    { email: new RegExp(req.query.q, 'i') },
    { phone: new RegExp(req.query.q, 'i') },
  ];
  if (req.query.blacklisted) filter.blacklisted = req.query.blacklisted === 'true';
  const r = await paginate(Tenant, filter, req.query);
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const t = await Tenant.findById(req.params.id).lean();
  if (!t) throw ApiError.notFound('Tenant not found');
  ok(res, t);
});

router.post('/', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), validate(createSchema), async (req, res) => {
  created(res, await Tenant.create(req.body));
});

router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER', 'AGENT'), validate(updateSchema), async (req, res) => {
  const t = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!t) throw ApiError.notFound('Tenant not found');
  ok(res, t);
});

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => {
  const t = await Tenant.findByIdAndDelete(req.params.id);
  if (!t) throw ApiError.notFound('Tenant not found');
  noContent(res);
});

module.exports = router;
