/**
 * CRM Leads seeder.
 *
 *   $ node src/seed/seeders/leads.seeder.js
 *   $ node src/seed/seeders/leads.seeder.js --reset
 */
const { User } = require('../../modules/users/user.model');
const { Property } = require('../../modules/properties/property.model');
const { Lead } = require('../../modules/crm/lead.model');
const { ensureConnected, log, runStandalone } = require('../runner');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const NAMES = ['Aria Cohen', 'Liam Wright', 'Noah Al Hashimi', 'Olivia Khan', 'Mason Singh', 'Emma Davis', 'Lucas Wang', 'Hannah Brooks'];
const STAGES = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
const SOURCES = ['WEBSITE', 'WALK_IN', 'REFERRAL', 'PORTAL'];

async function seedLeads({ reset = false, count = 18 } = {}) {
  await ensureConnected();
  if (reset) {
    log('leads', '🗑  resetting leads…');
    await Lead.deleteMany({});
  }

  const properties = await Property.find().lean();
  const agents = await User.find({ role: { $in: ['AGENT', 'MANAGER'] } }).lean();
  if (agents.length === 0) throw new Error('No agents found. Seed users first.');

  let created = 0;
  for (let i = 0; i < count; i++) {
    await Lead.create({
      name: pick(NAMES),
      email: `lead${Date.now()}-${i}@example.com`,
      phone: `+97150${r(1000000, 9999999)}`,
      propertyType: pick(['APARTMENT', 'VILLA', 'OFFICE']),
      targetProperty: properties.length ? pick(properties)._id : undefined,
      budgetMin: r(50000, 100000),
      budgetMax: r(120000, 400000),
      source: pick(SOURCES),
      stage: pick(STAGES),
      agent: pick(agents)._id,
      nextFollowUp: new Date(Date.now() + r(1, 14) * 86400000),
      notes: 'Showed interest after viewing brochure.',
    });
    created++;
  }

  log('leads', `✅ ${created} leads created`);
  return { created };
}

module.exports = seedLeads;

if (require.main === module) runStandalone(seedLeads, 'leads');
