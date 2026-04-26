const router = require('express').Router();
const { z } = require('zod');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const ctrl = require('./property.controller');

const ownerEntry = z.object({
  owner: z.string().min(1),
  percentage: z.number().min(0).max(100),
});

const createSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(['APARTMENT', 'VILLA', 'OFFICE', 'LAND']),
  status: z.enum(['AVAILABLE', 'RENTED', 'UNDER_MAINTENANCE']).optional(),
  location: z.object({
    area: z.string().optional(),
    community: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
  }).optional(),
  sizeSqm: z.number().optional(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  units: z.number().optional(),
  rentEstimate: z.number().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  owners: z.array(ownerEntry).optional(),
});

const updateSchema = createSchema.partial();

router.use(auth);
router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('SUPER_ADMIN', 'MANAGER'), validate(createSchema), ctrl.create);
router.patch('/:id', requireRole('SUPER_ADMIN', 'MANAGER'), validate(updateSchema), ctrl.update);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

module.exports = router;
