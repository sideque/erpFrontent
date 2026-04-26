const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, uppercase: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    contract: { type: mongoose.Schema.Types.ObjectId, ref: 'TenancyContract', index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'MOCK_GATEWAY'], default: 'CASH' },
    reference: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = { Payment };
