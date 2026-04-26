/**
 * Owners seeder.
 *
 *   $ node src/seed/seeders/owners.seeder.js
 *   $ node src/seed/seeders/owners.seeder.js --reset
 *
 * Idempotent: matched by email.
 */
const { Owner } = require('../../modules/owners/owner.model');
const data = require('../data/owners.data');
const { ensureConnected, log, runStandalone } = require('../runner');

async function seedOwners({ reset = false } = {}) {
  await ensureConnected();

  if (reset) {
    log('owners', '🗑  resetting owners collection…');
    await Owner.deleteMany({});
  }

  let created = 0;
  let updated = 0;

  for (const o of data) {
    const doc = { ...o, email: o.email.toLowerCase() };
    const res = await Owner.findOneAndUpdate(
      { email: doc.email },
      { $set: doc },
      { upsert: true, new: true, rawResult: true, setDefaultsOnInsert: true }
    );
    if (res.lastErrorObject?.upserted) created++;
    else updated++;
  }

  log('owners', `✅ ${created} created, ${updated} updated (total ${data.length})`);
  return { created, updated, total: data.length };
}

module.exports = seedOwners;

if (require.main === module) runStandalone(seedOwners, 'owners');
