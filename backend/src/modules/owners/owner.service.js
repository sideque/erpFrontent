const { Owner } = require('./owner.model');
const { Property } = require('../properties/property.model');
const ApiError = require('../../shared/utils/ApiError');
const { paginate } = require('../../shared/utils/paginate');

async function list(query) {
  const filter = {};
  if (query.q) {
    filter.$or = [
      { name: new RegExp(query.q, 'i') },
      { email: new RegExp(query.q, 'i') },
      { phone: new RegExp(query.q, 'i') },
    ];
  }
  return paginate(Owner, filter, query);
}

async function get(id) {
  const o = await Owner.findById(id).lean();
  if (!o) throw ApiError.notFound('Owner not found');
  const properties = await Property.find({ 'owners.owner': id }).select('code name type status location rentEstimate owners').lean();
  return { ...o, properties };
}

async function create(data) {
  return Owner.create(data);
}

async function update(id, patch) {
  const o = await Owner.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!o) throw ApiError.notFound('Owner not found');
  return o;
}

async function remove(id) {
  const linked = await Property.countDocuments({ 'owners.owner': id });
  if (linked > 0) throw ApiError.conflict('Owner is linked to one or more properties');
  const o = await Owner.findByIdAndDelete(id);
  if (!o) throw ApiError.notFound('Owner not found');
}

module.exports = { list, get, create, update, remove };
