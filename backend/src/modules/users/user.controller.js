const service = require('./user.service');
const { ok, created, noContent } = require('../../shared/utils/response');

exports.list = async (req, res) => {
  const r = await service.listUsers(req.query);
  ok(res, r.items, r.meta);
};

exports.get = async (req, res) => {
  const u = await service.getUser(req.params.id);
  ok(res, u);
};

exports.create = async (req, res) => {
  const u = await service.createUser(req.body);
  created(res, u);
};

exports.update = async (req, res) => {
  const u = await service.updateUser(req.params.id, req.body);
  ok(res, u);
};

exports.toggleStatus = async (req, res) => {
  const u = await service.setUserStatus(req.params.id, req.body.status);
  ok(res, u);
};

exports.remove = async (req, res) => {
  await service.deleteUser(req.params.id);
  noContent(res);
};

exports.summary = async (_req, res) => {
  ok(res, await service.summary());
};
