/**
 * Backwards-compatible entry point: `npm run seed` still works and is the
 * equivalent of `node src/seed/cli.js full --reset`.
 *
 * For more granular seeding, use:
 *
 *   node src/seed/cli.js users
 *   node src/seed/cli.js tenants --reset
 *   node src/seed/cli.js full
 */
process.argv = [process.argv[0], require.resolve('./cli.js'), 'full'];
require('./cli.js');
