const service = require('./property.service');
const { ok, created, noContent } = require('../../shared/utils/response');

exports.list = async (req, res) => {
  const r = await service.list(req.query);
  ok(res, r.items, r.meta);
};
exports.get = async (req, res) => ok(res, await service.get(req.params.id));
exports.create = async (req, res) => created(res, await service.create(req.body));
exports.update = async (req, res) => ok(res, await service.update(req.params.id, req.body));
exports.remove = async (req, res) => { await service.remove(req.params.id); noContent(res); };
exports.summary = async (_req, res) => ok(res, await service.summary());
