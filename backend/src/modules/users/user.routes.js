const router = require('express').Router();
const { z } = require('zod');
const { auth, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const ctrl = require('./user.controller');

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'MANAGER', 'ACCOUNTANT', 'AGENT']).default('AGENT'),
  phone: z.string().optional(),
  access: z.enum(['FULL_ACCESS', 'LIMITED_ADMIN', 'READ_ONLY']).optional(),
});

const updateSchema = createSchema.partial();

router.use(auth);

router.get('/summary', ctrl.summary);
router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', requireRole('SUPER_ADMIN'), validate(createSchema), ctrl.create);
router.patch('/:id', requireRole('SUPER_ADMIN'), validate(updateSchema), ctrl.update);
router.patch('/:id/status', requireRole('SUPER_ADMIN'), ctrl.toggleStatus);
router.delete('/:id', requireRole('SUPER_ADMIN'), ctrl.remove);

module.exports = router;
