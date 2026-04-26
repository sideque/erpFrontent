const ok = (res, data, meta) => res.json({ success: true, data, ...(meta ? { meta } : {}) });
const created = (res, data) => res.status(201).json({ success: true, data });
const noContent = (res) => res.status(204).send();

module.exports = { ok, created, noContent };
