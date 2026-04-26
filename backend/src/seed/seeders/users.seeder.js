/**
 * Users (admins / managers / accountants / agents) seeder.
 *
 *   $ node src/seed/seeders/users.seeder.js          # upserts (idempotent)
 *   $ node src/seed/seeders/users.seeder.js --reset  # wipes users first
 *
 * Idempotent: matches by email. Updates non-password fields on rerun, but
 * NEVER overwrites an existing password — so changing demo passwords is safe.
 */
const { User } = require('../../modules/users/user.model');
const data = require('../data/users.data');
const { ensureConnected, log, runStandalone } = require('../runner');

async function seedUsers({ reset = false } = {}) {
  await ensureConnected();

  if (reset) {
    log('users', '🗑  resetting users collection…');
    await User.deleteMany({});
  }

  let created = 0;
  let updated = 0;

  for (const u of data) {
    const existing = await User.findOne({ email: u.email.toLowerCase() });
    if (existing) {
      // Update non-password fields
      existing.name = u.name;
      existing.role = u.role;
      existing.access = u.access || existing.access;
      existing.status = u.status || 'ENABLED';
      existing.avatar = u.avatar || existing.avatar;
      existing.phone = u.phone || existing.phone;
      await existing.save();
      updated++;
    } else {
      const passwordHash = await User.hashPassword(u.password);
      await User.create({
        name: u.name,
        email: u.email.toLowerCase(),
        passwordHash,
        role: u.role,
        access: u.access || 'LIMITED_ADMIN',
        status: u.status || 'ENABLED',
        avatar: u.avatar || '',
        phone: u.phone || '',
      });
      created++;
    }
  }

  log('users', `✅ ${created} created, ${updated} updated (total ${data.length})`);
  return { created, updated, total: data.length };
}

module.exports = seedUsers;

if (require.main === module) runStandalone(seedUsers, 'users');
