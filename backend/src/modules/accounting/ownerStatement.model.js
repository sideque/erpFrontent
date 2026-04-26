const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema(
  {
    label: String,
    type: { type: String, enum: ['INCOME', 'EXPENSE', 'COMMISSION'] },
    amount: Number,
    reference: String,
    date: Date,
  },
  { _id: false }
);

const statementSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true },
    period: {
      label: String,
      start: Date,
      end: Date,
    },
    grossIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    netPayout: { type: Number, default: 0 },
    ownershipPct: { type: Number, default: 100 },
    lines: [lineSchema],
    status: { type: String, enum: ['DRAFT', 'APPROVED', 'PAID'], default: 'DRAFT', index: true },
    paidAt: { type: Date },
    paidMethod: String,
    notes: String,
  },
  { timestamps: true }
);

const OwnerStatement = mongoose.model('OwnerStatement', statementSchema);
module.exports = { OwnerStatement };
