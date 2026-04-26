/**
 * Tiny helper utilities used by every seeder.
 */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');

/**
 * Connect to Mongo if not already connected.
 */
async function ensureConnected() {
  if (mongoose.connection.readyState === 1) return;
  await connectDB();
}

/**
 * Disconnect (only call from CLI entry points, not from chained seeders).
 */
async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

/**
 * Standardised log formatter so every seeder is consistent.
 */
function log(scope, msg) {
  // eslint-disable-next-line no-console
  console.log(`[seed:${scope}] ${msg}`);
}

/**
 * Wrap a seeder so it can run standalone (e.g. `node src/seed/seeders/users.seeder.js`)
 * AND be imported by the CLI / full seed.
 *
 * Usage at the bottom of any seeder file:
 *
 *   if (require.main === module) runStandalone(seedUsers);
 */
function runStandalone(fn, scope = '') {
  if (require.main !== module && typeof fn !== 'function') return;
  (async () => {
    try {
      const flags = parseFlags(process.argv);
      await ensureConnected();
      const result = await fn({ reset: !!flags.reset });
      log(scope || 'done', `✅ ${typeof result === 'object' ? JSON.stringify(result) : result || 'completed'}`);
      await disconnect();
      process.exit(0);
    } catch (err) {
      console.error(`[seed] FAILED:`, err.message);
      console.error(err);
      await disconnect();
      process.exit(1);
    }
  })();
}

function parseFlags(argv) {
  const flags = {};
  for (const a of argv.slice(2)) {
    if (a.startsWith('--')) flags[a.slice(2)] = true;
  }
  return flags;
}

module.exports = { ensureConnected, disconnect, log, runStandalone, parseFlags };
