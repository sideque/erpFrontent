const router = require('express').Router();
const { z } = require('zod');
const { auth } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/middleware/validate');
const { ok } = require('../../shared/utils/response');
const service = require('./auth.service');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const result = await service.login(req.body.email, req.body.password);
  ok(res, result);
});

router.get('/me', auth, async (req, res) => {
  ok(res, await service.me(req.user.id));
});

module.exports = router;
