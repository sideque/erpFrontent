const mongoose = require('mongoose');

/**
 * Journal Entry — a USER-FACING document for manual journal postings.
 *
 * (Different from `GLEntry`, which is the atomic ledger row.)
 *
 * On save, the JE generates one GL Entry per line, all carrying the JE's
 * voucherNo. Cancellation creates reversing GL entries.
 *
 * Use cases (just like ERPNext):
 *   - Opening balances
 *   - Depreciation
 *   - Inter-account adjustments
 *   - Bank reconciliation differences
 *   - Manual write-offs / accruals
 */

const JE_TYPES = [
  'JOURNAL_ENTRY',
  'OPENING_ENTRY',
  'BANK_ENTRY',
  'CASH_ENTRY',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'DEPRECIATION',
  'EXCHANGE_RATE_REVALUATION',
  'WRITE_OFF',
];

const lineSchema = new mongoose.Schema(
  {
    accountCode: { type: String, required: true },
    accountName: { type: String },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    party: { type: String, enum: ['TENANT', 'OWNER', null], default: null },
    partyId: { type: mongoose.Schema.Types.ObjectId, default: null },
    partyName: { type: String, default: '' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
    remarks: { type: String, default: '' },
  },
  { _id: false }
);

const journalSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    type: { type: String, enum: JE_TYPES, default: 'JOURNAL_ENTRY', index: true },
    postingDate: { type: Date, required: true, default: Date.now, index: true },
    title: { type: String, default: '' },
    memo: { type: String, default: '' },
    lines: [lineSchema],
    totalDebit: { type: Number, default: 0 },
    totalCredit: { type: Number, default: 0 },
    status: { type: String, enum: ['DRAFT', 'POSTED', 'CANCELLED'], default: 'POSTED', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

journalSchema.pre('validate', function (next) {
  this.totalDebit = +(this.lines || []).reduce((s, l) => s + Number(l.debit || 0), 0).toFixed(2);
  this.totalCredit = +(this.lines || []).reduce((s, l) => s + Number(l.credit || 0), 0).toFixed(2);
  if (Math.round((this.totalDebit - this.totalCredit) * 100) !== 0) {
    return next(new Error(`Unbalanced journal entry: D=${this.totalDebit} C=${this.totalCredit}`));
  }
  if (this.totalDebit === 0) {
    return next(new Error('Journal entry total cannot be zero'));
  }
  next();
});

const JournalEntry = mongoose.model('JournalEntry', journalSchema);
module.exports = { JournalEntry, JE_TYPES };
