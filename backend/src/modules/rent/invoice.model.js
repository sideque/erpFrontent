const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, uppercase: true },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'TenancyContract', required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: { type: String, enum: ['RENT', 'SECURITY_DEPOSIT', 'PENALTY', 'OTHER'], default: 'RENT' },
    period: {
      label: { type: String }, // e.g. "Jan 2026"
      start: { type: Date },
      end: { type: Date },
    },
    issueDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

invoiceSchema.virtual('balance').get(function () {
  return Math.max(0, (this.amount || 0) - (this.paidAmount || 0));
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = { Invoice };
