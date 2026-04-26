const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const { User } = require('../users/user.model');
const ApiError = require('../../shared/utils/ApiError');

function sign(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email, name: user.name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES }
  );
}

async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (user.status === 'DISABLED') throw ApiError.forbidden('Account disabled');
  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid credentials');
  user.lastLoginAt = new Date();
  await user.save();
  return { user: user.toJSON(), token: sign(user) };
}

async function me(userId) {
  const u = await User.findById(userId).lean();
  if (!u) throw ApiError.notFound('User not found');
  return u;
}

module.exports = { login, me };
