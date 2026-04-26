/**
 * Expenses seeder. Creates 30 randomly-distributed expenses across all
 * properties, each posting to the GL via accounting.postExpense.
 *
 *   $ node src/seed/seeders/expenses.seeder.js
 *   $ node src/seed/seeders/expenses.seeder.js --reset
 */
const { Property } = require('../../modules/properties/property.model');
const { Expense, CATEGORY_ACCOUNT } = require('../../modules/expenses/expense.model');
const { GLEntry } = require('../../modules/accounting/glEntry.model');
const accounting = require('../../modules/accounting/accounting.service');
const { ensureConnected, log, runStandalone } = require('../runner');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const TITLES = {
  MAINTENANCE: ['AC repair', 'Plumbing fix', 'Painting', 'Pest control'],
  UTILITY: ['DEWA bill', 'Internet bill', 'Cooling charge'],
  VENDOR: ['Cleaning service', 'Security service', 'Garden maintenance'],
  INSURANCE: ['Annual property insurance'],
  TAX: ['Service charge', 'Municipality fee'],
  OTHER: ['Misc admin fee'],
};

async function seedExpenses({ reset = false, count = 30 } = {}) {
  await ensureConnected();

  if (reset) {
    log('expenses', '🗑  resetting expenses + their GL entries…');
    await Promise.all([
      Expense.deleteMany({}),
      GLEntry.deleteMany({ voucherType: 'PURCHASE_INVOICE' }),
    ]);
  }

  const properties = await Property.find().lean();
  if (properties.length === 0) throw new Error('No properties found. Run properties seeder first.');

  const cats = Object.keys(TITLES);
  let created = 0;

  for (let i = 0; i < count; i++) {
    const cat = pick(cats);
    const acc = CATEGORY_ACCOUNT[cat];
    const date = new Date();
    date.setMonth(date.getMonth() - r(0, 8));

    const seq = (await Expense.countDocuments()) + 1;
    const exp = await Expense.create({
      number: `EXP-${date.getFullYear()}-${String(seq).padStart(5, '0')}`,
      title: pick(TITLES[cat]),
      category: cat,
      property: pick(properties)._id,
      vendor: pick(['Al Falah Services', 'Dubai Maintenance LLC', 'Vendor One', 'BlueClean']),
      amount: r(200, 8000),
      date,
      paidVia: pick(['BANK', 'CASH']),
      accountCode: acc.code,
      accountName: acc.name,
    });
    await accounting.postExpense(exp);
    created++;
  }

  log('expenses', `✅ ${created} expenses created and posted to the ledger`);
  return { created };
}

module.exports = seedExpenses;

if (require.main === module) runStandalone(seedExpenses, 'expenses');
