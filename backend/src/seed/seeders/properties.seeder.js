/**
 * Properties seeder.
 *
 *   $ node src/seed/seeders/properties.seeder.js
 *   $ node src/seed/seeders/properties.seeder.js --reset
 *
 * Resolves owner emails → owner ObjectIds at insert time. Owners must already
 * exist (run the owners seeder first, or use the full seed which handles order).
 *
 * Idempotent: matched by `code`.
 */
const { Property } = require('../../modules/properties/property.model');
const { Owner } = require('../../modules/owners/owner.model');
const data = require('../data/properties.data');
const { ensureConnected, log, runStandalone } = require('../runner');

async function seedProperties({ reset = false } = {}) {
  await ensureConnected();

  if (reset) {
    log('properties', '🗑  resetting properties collection…');
    await Property.deleteMany({});
  }

  // Build owner email → ObjectId lookup table.
  const owners = await Owner.find().select('_id email').lean();
  const ownerByEmail = new Map(owners.map((o) => [o.email, o._id]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of data) {
    const ownerLinks = [];
    for (const ref of p.ownerEmails || []) {
      const id = ownerByEmail.get(ref.email.toLowerCase());
      if (!id) {
        log('properties', `⚠  owner "${ref.email}" not found, skipping for ${p.code}`);
        continue;
      }
      ownerLinks.push({ owner: id, percentage: ref.percentage });
    }

    const totalPct = ownerLinks.reduce((s, x) => s + x.percentage, 0);
    if (ownerLinks.length === 0 || Math.round(totalPct) !== 100) {
      log('properties', `⚠  ${p.code} skipped (owners total ${totalPct}%, must be 100%)`);
      skipped++;
      continue;
    }

    const { ownerEmails: _omit, ...rest } = p;
    const doc = { ...rest, owners: ownerLinks };

    const res = await Property.findOneAndUpdate(
      { code: p.code },
      { $set: doc },
      { upsert: true, new: true, rawResult: true, setDefaultsOnInsert: true }
    );
    if (res.lastErrorObject?.upserted) created++;
    else updated++;
  }

  log('properties', `✅ ${created} created, ${updated} updated, ${skipped} skipped (total ${data.length})`);
  return { created, updated, skipped, total: data.length };
}

module.exports = seedProperties;

if (require.main === module) runStandalone(seedProperties, 'properties');
