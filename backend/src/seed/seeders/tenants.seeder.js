/**
 * Tenants seeder.
 *
 *   $ node src/seed/seeders/tenants.seeder.js
 *   $ node src/seed/seeders/tenants.seeder.js --reset
 *
 * Idempotent: matched by email.
 */
const { Tenant } = require('../../modules/tenants/tenant.model');
const data = require('../data/tenants.data');
const { ensureConnected, log, runStandalone } = require('../runner');

async function seedTenants({ reset = false } = {}) {
  await ensureConnected();

  if (reset) {
    log('tenants', '🗑  resetting tenants collection…');
    await Tenant.deleteMany({});
  }

  let created = 0;
  let updated = 0;

  for (const t of data) {
    const doc = { ...t, email: t.email.toLowerCase() };
    const res = await Tenant.findOneAndUpdate(
      { email: doc.email },
      { $set: doc },
      { upsert: true, new: true, rawResult: true, setDefaultsOnInsert: true }
    );
    if (res.lastErrorObject?.upserted) created++;
    else updated++;
  }

  log('tenants', `✅ ${created} created, ${updated} updated (total ${data.length})`);
  return { created, updated, total: data.length };
}

module.exports = seedTenants;

if (require.main === module) runStandalone(seedTenants, 'tenants');
