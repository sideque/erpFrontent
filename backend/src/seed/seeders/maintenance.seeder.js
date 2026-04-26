/**
 * Maintenance tickets seeder.
 *
 *   $ node src/seed/seeders/maintenance.seeder.js
 *   $ node src/seed/seeders/maintenance.seeder.js --reset
 */
const { Property } = require('../../modules/properties/property.model');
const { Tenant } = require('../../modules/tenants/tenant.model');
const { MaintenanceTicket } = require('../../modules/maintenance/maintenance.model');
const { ensureConnected, log, runStandalone } = require('../runner');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

async function seedMaintenance({ reset = false, count = 8 } = {}) {
  await ensureConnected();
  if (reset) {
    log('maintenance', '🗑  resetting tickets…');
    await MaintenanceTicket.deleteMany({});
  }

  const properties = await Property.find().lean();
  const tenants = await Tenant.find().lean();
  if (properties.length === 0) throw new Error('No properties found.');

  let created = 0;
  for (let i = 0; i < count; i++) {
    const seq = (await MaintenanceTicket.countDocuments()) + 1;
    await MaintenanceTicket.create({
      number: `TKT-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`,
      title: pick(['Leaky faucet', 'Broken AC', 'Clogged drain', 'Door handle issue', 'Light fixture']),
      description: 'Tenant reported issue. Needs inspection.',
      property: pick(properties)._id,
      tenant: tenants.length ? pick(tenants)._id : undefined,
      priority: pick(['LOW', 'MEDIUM', 'HIGH']),
      status: pick(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']),
      assigneeName: pick(['Ramesh Kumar', 'Mohamed Ali', 'Jose Cruz']),
      vendor: pick(['Al Falah Services', 'Dubai Maintenance LLC']),
      estimatedCost: r(200, 3000),
    });
    created++;
  }

  log('maintenance', `✅ ${created} tickets created`);
  return { created };
}

module.exports = seedMaintenance;

if (require.main === module) runStandalone(seedMaintenance, 'maintenance');
