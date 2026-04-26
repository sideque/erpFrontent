/**
 * Management + Tenancy Contracts seeder.
 *
 *   $ node src/seed/seeders/contracts.seeder.js
 *   $ node src/seed/seeders/contracts.seeder.js --reset
 *
 * For every property:
 *   1. Creates a Management Contract (owner ↔ company, with a commission %).
 *   2. For RENTED properties, also creates a Tenancy Contract (tenant ↔ property)
 *      and triggers `rentService.generateInvoicesForContract` which posts
 *      accrual GL entries and creates rent invoices.
 *
 * Idempotent: matched by `code`. If contracts already exist, they are skipped
 * (because invoices/GL entries are tied to them and shouldn't be duplicated).
 *
 * NOTE: --reset wipes contracts AND their downstream invoices/payments/GL.
 */
const { Property } = require('../../modules/properties/property.model');
const { Tenant } = require('../../modules/tenants/tenant.model');
const { ManagementContract } = require('../../modules/management-contracts/managementContract.model');
const { TenancyContract } = require('../../modules/tenancy-contracts/tenancyContract.model');
const { Invoice } = require('../../modules/rent/invoice.model');
const { Payment } = require('../../modules/rent/payment.model');
const { GLEntry } = require('../../modules/accounting/glEntry.model');
const rentService = require('../../modules/rent/rent.service');
const { ensureFiscalYearFor } = require('../../modules/accounting/fiscalYear.model');
const { ensureSystemAccounts } = require('../../modules/accounting/account.model');
const { ensureConnected, log, runStandalone } = require('../runner');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedContracts({ reset = false } = {}) {
  await ensureConnected();
  await ensureSystemAccounts();
  await ensureFiscalYearFor(new Date());

  if (reset) {
    log('contracts', '🗑  resetting contracts + downstream invoices/payments/GL…');
    await Promise.all([
      ManagementContract.deleteMany({}),
      TenancyContract.deleteMany({}),
      Invoice.deleteMany({}),
      Payment.deleteMany({}),
      GLEntry.deleteMany({ voucherType: { $in: ['SALES_INVOICE', 'PAYMENT_ENTRY'] } }),
    ]);
  }

  const properties = await Property.find().lean();
  const tenants = await Tenant.find().lean();

  if (properties.length === 0) {
    throw new Error('No properties found. Run the properties seeder first.');
  }
  if (tenants.length === 0) {
    log('contracts', '⚠  No tenants found — tenancy contracts will be skipped.');
  }

  let mgCreated = 0;
  let tcCreated = 0;
  let invoicesCount = 0;

  // Management contracts: one per property
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const code = `MC-${1000 + i}`;
    const exists = await ManagementContract.findOne({ code });
    if (exists) continue;

    await ManagementContract.create({
      code,
      property: p._id,
      owners: p.owners.map((o) => o.owner),
      commissionPct: pick([5, 7, 8, 10]),
      startDate: new Date('2024-01-01'),
      endDate: new Date('2027-12-31'),
      expensesBornBy: 'OWNER',
      incomeRule: 'NET_AFTER_EXPENSES',
      status: 'ACTIVE',
    });
    mgCreated++;
  }

  // Tenancy contracts for RENTED properties
  const rented = properties.filter((p) => p.status === 'RENTED');
  for (let i = 0; i < rented.length; i++) {
    const p = rented[i];
    const code = `TC-${2000 + i}`;
    const exists = await TenancyContract.findOne({ code });
    if (exists) continue;

    const tenant = tenants[i % tenants.length];
    if (!tenant) break;

    const annual = p.rentEstimate || 100000;
    const start = new Date();
    start.setMonth(start.getMonth() - 8);
    start.setDate(1);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    const contract = await TenancyContract.create({
      code,
      property: p._id,
      tenant: tenant._id,
      annualRent: annual,
      paymentSchedule: pick(['MONTHLY', 'QUARTERLY']),
      securityDeposit: Math.round(annual * 0.05),
      startDate: start,
      endDate: end,
      moveInDate: start,
      status: 'ACTIVE',
      rules: 'No pets. No smoking inside.',
    });
    tcCreated++;
    invoicesCount += await rentService.generateInvoicesForContract(contract);
  }

  log('contracts', `✅ ${mgCreated} mgmt contracts, ${tcCreated} tenancy contracts, ${invoicesCount} invoices generated`);
  return { mgCreated, tcCreated, invoicesCount };
}

module.exports = seedContracts;

if (require.main === module) runStandalone(seedContracts, 'contracts');
