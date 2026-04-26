const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = ['MAINTENANCE', 'UTILITY', 'VENDOR', 'INSURANCE', 'TAX', 'OTHER'];

const CATEGORY_ACCOUNT = {
  MAINTENANCE: { code: '5100', name: 'Maintenance Expense' },
  UTILITY: { code: '5200', name: 'Utility Expense' },
  VENDOR: { code: '5300', name: 'Vendor Expense' },
  INSURANCE: { code: '5900', name: 'Other Expense' },
  TAX: { code: '5900', name: 'Other Expense' },
  OTHER: { code: '5900', name: 'Other Expense' },
};

const expenseSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true, index: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', index: true },
    vendor: { type: String, default: '' },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now, index: true },
    paidVia: { type: String, enum: ['CASH', 'BANK'], default: 'BANK' },
    receiptUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accountCode: { type: String },
    accountName: { type: String },
  },
  { timestamps: true }
);

const Expense = mongoose.model('Expense', expenseSchema);
module.exports = { Expense, EXPENSE_CATEGORIES, CATEGORY_ACCOUNT };
