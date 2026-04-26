/**
 * Pays a portion of past-due invoices to simulate realistic accounting state.
 *
 *   $ node src/seed/seeders/payments.seeder.js
 *
 * Heuristic: 80% of past invoices fully paid, 10% partial, 10% remain overdue.
 * Each payment hits the GL via `rentService.recordPayment`.
 */
const { Invoice } = require('../../modules/rent/invoice.model');
const rentService = require('../../modules/rent/rent.service');
const { ensureConnected, log, runStandalone } = require('../runner');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedPayments(/* { reset = false } = {} */) {
  await ensureConnected();

  const today = new Date();
  const pastInvoices = await Invoice.find({
    dueDate: { $lt: today },
    status: { $in: ['PENDING', 'OVERDUE'] },
  });

  if (pastInvoices.length === 0) {
    log('payments', 'No past-due invoices to pay (run contracts seeder first?)');
    return { paid: 0 };
  }

  let paid = 0;
  let partial = 0;
  for (let i = 0; i < pastInvoices.length; i++) {
    const inv = pastInvoices[i];
    const dice = Math.random();
    if (dice < 0.8) {
      await rentService.recordPayment({
        invoiceId: inv._id,
        amount: inv.amount,
        method: pick(['BANK_TRANSFER', 'CASH', 'CHEQUE']),
        reference: `MOCK-${100000 + i}`,
        notes: 'Auto-seeded payment',
      });
      paid++;
    } else if (dice < 0.9) {
      await rentService.recordPayment({
        invoiceId: inv._id,
        amount: Math.round(inv.amount * 0.5),
        method: 'BANK_TRANSFER',
        reference: `MOCK-PARTIAL-${i}`,
      });
      partial++;
    }
  }

  log('payments', `✅ ${paid} paid, ${partial} partial, ${pastInvoices.length - paid - partial} unpaid`);
  return { paid, partial };
}

module.exports = seedPayments;

if (require.main === module) runStandalone(seedPayments, 'payments');
