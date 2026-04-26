const mongoose = require('mongoose');

/**
 * GL Entry — the atom of the General Ledger.
 *
 * One row per account-hit per voucher. ERPNext's `tabGL Entry` analogue.
 * GL Entries are immutable — to undo a voucher, post a reversal.
 *
 * Indexed by every common report axis: account, party, property, posting date,
 * voucher.
 */

const VOUCHER_TYPES = [
  'SALES_INVOICE',
  'PURCHASE_INVOICE',
  'PAYMENT_ENTRY',
  'JOURNAL_ENTRY',
  'OWNER_SETTLEMENT',
  'PERIOD_CLOSING',
];

const PARTY_TYPES = ['TENANT', 'OWNER'];

const glEntrySchema = new mongoose.Schema(
  {
    postingDate: { type: Date, required: true, index: true },
    fiscalYear: { type: String, required: true, index: true },

    account: { type: String, required: true, index: true }, // account code
    accountName: { type: String, required: true },
    rootType: { type: String, required: true, index: true },

    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },

    party: { type: String, enum: [...PARTY_TYPES, null], default: null, index: true },
    partyId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    partyName: { type: String, default: '' },

    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null, index: true },

    voucherType: { type: String, enum: VOUCHER_TYPES, required: true, index: true },
    voucherNo: { type: String, required: true, index: true },
    voucherId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },

    againstAccounts: { type: String, default: '' }, // comma-separated peer account codes for the voucher (ERPNext-style)
    remarks: { type: String, default: '' },

    isCancelled: { type: Boolean, default: false, index: true },
    isReversal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

glEntrySchema.index({ account: 1, postingDate: 1 });
glEntrySchema.index({ party: 1, partyId: 1, postingDate: 1 });
glEntrySchema.index({ property: 1, postingDate: 1 });
glEntrySchema.index({ voucherType: 1, voucherNo: 1 });

glEntrySchema.pre('validate', function (next) {
  if ((this.debit > 0 && this.credit > 0) || (this.debit === 0 && this.credit === 0)) {
    return next(new Error('GL Entry must have exactly one of debit or credit > 0'));
  }
  next();
});

const GLEntry = mongoose.model('GLEntry', glEntrySchema);
module.exports = { GLEntry, VOUCHER_TYPES };
