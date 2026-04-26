const { Property } = require('./property.model');
const ApiError = require('../../shared/utils/ApiError');
const { paginate } = require('../../shared/utils/paginate');

async function list(query) {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { code: new RegExp(query.q, 'i') },
      { 'location.area': new RegExp(query.q, 'i') },
      { 'location.community': new RegExp(query.q, 'i') },
    ];
  }
  return paginate(Property, filter, query, { populate: { path: 'owners.owner', select: 'name email phone' } });
}

async function get(id) {
  const p = await Property.findById(id).populate('owners.owner', 'name email phone idType idNumber').lean();
  if (!p) throw ApiError.notFound('Property not found');
  return p;
}

function validateOwners(owners) {
  if (!owners || owners.length === 0) return;
  const total = owners.reduce((s, o) => s + Number(o.percentage || 0), 0);
  if (Math.round(total) !== 100) {
    throw ApiError.badRequest('Total ownership percentage must equal 100');
  }
}

async function create(data) {
  validateOwners(data.owners);
  const p = await Property.create(data);
  return get(p._id);
}

async function update(id, patch) {
  if (patch.owners) validateOwners(patch.owners);
  const p = await Property.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!p) throw ApiError.notFound('Property not found');
  return get(p._id);
}

async function remove(id) {
  const p = await Property.findByIdAndDelete(id);
  if (!p) throw ApiError.notFound('Property not found');
}

async function summary() {
  const [total, byStatus, byType] = await Promise.all([
    Property.countDocuments(),
    Property.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Property.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
  ]);
  const status = byStatus.reduce((a, x) => ({ ...a, [x._id]: x.count }), {});
  const types = byType.reduce((a, x) => ({ ...a, [x._id]: x.count }), {});
  const occupancy = total ? Math.round(((status.RENTED || 0) / total) * 100) : 0;
  return { total, status, types, occupancy };
}

module.exports = { list, get, create, update, remove, summary };
