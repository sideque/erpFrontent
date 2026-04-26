const mongoose = require('mongoose');

const tenancySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    annualRent: { type: Number, required: true, min: 0 },
    paymentSchedule: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'],
      default: 'MONTHLY',
    },
    securityDeposit: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    moveInDate: { type: Date },
    moveOutDate: { type: Date },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED', 'RENEWED'],
      default: 'ACTIVE',
      index: true,
    },
    rules: { type: String, default: '' },
    penaltyTerms: { type: String, default: '' },
    invoicesGenerated: { type: Boolean, default: false },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const TenancyContract = mongoose.model('TenancyContract', tenancySchema);
module.exports = { TenancyContract };
