function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

async function paginate(model, filter = {}, query = {}, options = {}) {
  const { page, limit, skip } = parsePagination(query);
  const sort = options.sort || { createdAt: -1 };
  const populate = options.populate || [];

  let q = model.find(filter).sort(sort).skip(skip).limit(limit);
  for (const p of [].concat(populate)) q = q.populate(p);

  const [items, total] = await Promise.all([q.lean(), model.countDocuments(filter)]);
  return {
    items,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}

module.exports = { paginate, parsePagination };
