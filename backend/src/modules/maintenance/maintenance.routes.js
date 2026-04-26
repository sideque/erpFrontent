const router = require('express').Router();
const { z } = require('zod');
const { MaintenanceTicket } = require('./maintenance.model');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

const schema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  property: z.string(),
  tenant: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  assigneeName: z.string().optional(),
  vendor: z.string().optional(),
  estimatedCost: z.number().optional(),
  actualCost: z.number().optional(),
});

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.property) filter.property = req.query.property;
  const r = await paginate(MaintenanceTicket, filter, req.query, {
    populate: [{ path: 'property', select: 'code name' }, { path: 'tenant', select: 'name' }],
  });
  ok(res, r.items, r.meta);
});

router.get('/:id', async (req, res) => {
  const t = await MaintenanceTicket.findById(req.params.id).populate('property').populate('tenant').lean();
  if (!t) throw ApiError.notFound('Ticket not found');
  ok(res, t);
});

router.post('/', validate(schema), async (req, res) => {
  const seq = (await MaintenanceTicket.countDocuments()) + 1;
  const t = await MaintenanceTicket.create({
    ...req.body,
    number: `TKT-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
  });
  created(res, t);
});

router.patch('/:id', validate(schema.partial()), async (req, res) => {
  const patch = { ...req.body };
  if (patch.status === 'RESOLVED' || patch.status === 'CLOSED') patch.resolvedAt = new Date();
  const t = await MaintenanceTicket.findByIdAndUpdate(req.params.id, patch, { new: true });
  if (!t) throw ApiError.notFound('Ticket not found');
  ok(res, t);
});

router.delete('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), async (req, res) => {
  const t = await MaintenanceTicket.findByIdAndDelete(req.params.id);
  if (!t) throw ApiError.notFound('Ticket not found');
  noContent(res);
});

module.exports = router;
