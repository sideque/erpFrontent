const jwt = require('jsonwebtoken');
const env = require('../../config/env');
const ApiError = require('../utils/ApiError');

function auth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized('Missing token');
  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = payload; // { id, role, email, name }
    next();
  } catch (e) {
    throw ApiError.unauthorized('Invalid or expired token');
  }
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) throw ApiError.forbidden('Insufficient permissions');
    next();
  };
}

module.exports = { auth, requireRole };
