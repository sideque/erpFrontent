#!/usr/bin/env node
/**
 * Vantus ERP — Seed CLI
 *
 *   node src/seed/cli.js <command> [--reset]
 *
 * Commands:
 *   users         Create demo admins / managers / accountants / agents
 *   owners        Create demo property owners
 *   tenants       Create demo tenants
 *   properties    Create demo properties (requires owners)
 *   contracts     Create management + tenancy contracts (requires properties + tenants)
 *   payments      Pay 80% of past-due invoices (requires invoices)
 *   expenses      Create 30 random expenses
 *   maintenance   Create 8 maintenance tickets
 *   leads         Create 18 CRM leads
 *   full | all    Wipe DB and seed everything in dependency order
 *   list          Print this help
 *
 * Flags:
 *   --reset       Wipe the target collection(s) first
 */

const { ensureConnected, disconnect, parseFlags, log } = require('./runner');
const { ensureSystemAccounts } = require('../modules/accounting/account.model');
const { ensureFiscalYearFor } = require('../modules/accounting/fiscalYear.model');

const COMMANDS = {
  users:        require('./seeders/users.seeder'),
  owners:       require('./seeders/owners.seeder'),
  tenants:      require('./seeders/tenants.seeder'),
  properties:   require('./seeders/properties.seeder'),
  contracts:    require('./seeders/contracts.seeder'),
  payments:     require('./seeders/payments.seeder'),
  expenses:     require('./seeders/expenses.seeder'),
  maintenance:  require('./seeders/maintenance.seeder'),
  leads:        require('./seeders/leads.seeder'),
};

function help() {
  console.log(`
Vantus ERP — Seed CLI

Usage:  node src/seed/cli.js <command> [--reset]

Commands:
  users         Demo admins / managers / accountants / agents
  owners        Property owners
  tenants       Tenants
  properties    Properties (requires owners)
  contracts     Management + tenancy contracts (requires properties + tenants)
  payments      Pay 80% of past-due invoices
  expenses      Random expenses
  maintenance   Maintenance tickets
  leads         CRM leads
  full | all    Wipe DB and seed everything in dependency order

Flags:
  --reset       Wipe the target collection(s) first
`);
}

async function full({ reset = true } = {}) {
  log('full', '🚀 starting full seed…');
  await ensureConnected();
  await ensureSystemAccounts();
  await ensureFiscalYearFor(new Date());

  // Order matters: users → owners → tenants → properties → contracts → payments → expenses → maintenance → leads
  await COMMANDS.users({ reset });
  await COMMANDS.owners({ reset });
  await COMMANDS.tenants({ reset });
  await COMMANDS.properties({ reset });
  await COMMANDS.contracts({ reset });
  await COMMANDS.payments();
  await COMMANDS.expenses({ reset });
  await COMMANDS.maintenance({ reset });
  await COMMANDS.leads({ reset });

  log('full', '✅ all seeders completed');
  log('full', '👤 admin login: admin@vantus.com / admin123');
}

(async () => {
  const cmd = process.argv[2];
  const flags = parseFlags(process.argv);

  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h' || cmd === 'list') {
    help();
    process.exit(0);
  }

  try {
    if (cmd === 'full' || cmd === 'all' || cmd === 'seedall' || cmd === 'everything') {
      await full({ reset: true });
    } else if (COMMANDS[cmd]) {
      await ensureConnected();
      await ensureSystemAccounts();
      await ensureFiscalYearFor(new Date());
      const result = await COMMANDS[cmd]({ reset: !!flags.reset });
      log(cmd, JSON.stringify(result));
    } else {
      console.error(`❌ Unknown command: ${cmd}\n`);
      help();
      process.exit(1);
    }
    await disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[seed] FAILED:', err.message);
    console.error(err);
    await disconnect();
    process.exit(1);
  }
})();
