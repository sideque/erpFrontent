const router = require('express').Router();
const { z } = require('zod');
const { Lead } = require('./lead.model');
const { auth } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { paginate } = require('../../shared/utils/paginate');
const { ok, created, noContent } = require('../../shared/utils/response');
const ApiError = require('../../shared/utils/ApiError');

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  propertyType: z.enum(['APARTMENT', 'VILLA', 'OFFICE', 'LAND']).optional(),
  targetProperty: z.string().optional(),
  budgetMin: z.number().optional(),
  budgetMax: z.number().optional(),
  source: z.enum(['WEBSITE', 'WALK_IN', 'REFERRAL', 'PORTAL', 'OTHER']).optional(),
  stage: z.enum(['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
  agent: z.string().optional(),
  nextFollowUp: z.string().optional(),
  notes: z.string().optional(),
});

router.use(auth);

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.stage) filter.stage = req.query.stage;
  if (req.query.agent) filter.agent = req.query.agent;
  const r = await paginate(Lead, filter, req.query, { populate: { path: 'agent', select: 'name avatar' } });
  ok(res, r.items, r.meta);
});

router.get('/pipeline', async (_req, res) => {
  const stages = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const result = {};
  for (const s of stages) {
    result[s] = await Lead.find({ stage: s }).sort({ updatedAt: -1 }).limit(50).populate('agent', 'name avatar').lean();
  }
  ok(res, result);
});

router.post('/', validate(schema), async (req, res) => created(res, await Lead.create(req.body)));

router.patch('/:id', validate(schema.partial()), async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) throw ApiError.notFound('Lead not found');
  if (req.body.stage && req.body.stage !== lead.stage) {
    lead.history.push({ stage: req.body.stage, at: new Date(), note: req.body.notes || '' });
  }
  Object.assign(lead, req.body);
  await lead.save();
  ok(res, lead);
});

router.delete('/:id', async (req, res) => {
  const l = await Lead.findByIdAndDelete(req.params.id);
  if (!l) throw ApiError.notFound('Lead not found');
  noContent(res);
});

module.exports = router;
