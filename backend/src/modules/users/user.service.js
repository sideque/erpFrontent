const { User } = require('./user.model');
const ApiError = require('../../shared/utils/ApiError');
const { paginate } = require('../../shared/utils/paginate');

async function listUsers(query) {
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { email: new RegExp(query.q, 'i') },
    ];
  }
  return paginate(User, filter, query, { sort: { createdAt: -1 } });
}

async function getUser(id) {
  const u = await User.findById(id).lean();
  if (!u) throw ApiError.notFound('User not found');
  return u;
}

async function createUser({ name, email, password, role = 'AGENT', phone, access }) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('Email already in use');
  const passwordHash = await User.hashPassword(password);
  const u = await User.create({ name, email, passwordHash, role, phone, access });
  return u.toJSON();
}

async function updateUser(id, patch) {
  if (patch.password) {
    patch.passwordHash = await User.hashPassword(patch.password);
    delete patch.password;
  }
  const u = await User.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!u) throw ApiError.notFound('User not found');
  return u.toJSON();
}

async function setUserStatus(id, status) {
  return updateUser(id, { status });
}

async function deleteUser(id) {
  const u = await User.findByIdAndDelete(id);
  if (!u) throw ApiError.notFound('User not found');
}

async function summary() {
  const [total, byRole, enabled, disabled] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments({ status: 'ENABLED' }),
    User.countDocuments({ status: 'DISABLED' }),
  ]);
  const roles = byRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});
  return { total, enabled, disabled, roles };
}

module.exports = { listUsers, getUser, createUser, updateUser, setUserStatus, deleteUser, summary };
