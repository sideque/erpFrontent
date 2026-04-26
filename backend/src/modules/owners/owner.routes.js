const router = require('express').Router();
const { z } = require('zod');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const service = require('./owner.service');
const { ok, created, noContent } = require('../../shared/utils/response');

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  nationality: z.string().optional(),
  idType: z.enum(['EMIRATES_ID', 'PASSPORT']).optional(),
  idNumber: z.string().optional(),
  idImage: z.string().optional(),
  address: z.string().optional(),
  bankAccount: z.object({
    bankName: z.string().optional(),
    iban: z.string().optional(),
    accountName: z.string().optional(),
  }).optional(),
  avatar: z.string().optional(),
  notes: z.string().optional(),
  verified: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

router.use(auth);
router.get('/', async (req, res) => { const r = await service.list(req.query); ok(res, r.items, r.meta); });
router.get('/:id', async (req, res) => ok(res, await service.get(req.params.id)));
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), validate(createSchema), async (req, res) => created(res, await service.create(req.body)));
router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), validate(updateSchema), async (req, res) => ok(res, await service.update(req.params.id, req.body)));
router.delete('/:id', requireRole('SUPER_ADMIN'), async (req, res) => { await service.remove(req.params.id); noContent(res); });

module.exports = router;
