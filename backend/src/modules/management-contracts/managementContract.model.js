const mongoose = require('mongoose');

const mgmtSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' }],
    commissionPct: { type: Number, required: true, min: 0, max: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    expensesBornBy: { type: String, enum: ['OWNER', 'COMPANY', 'SHARED'], default: 'OWNER' },
    incomeRule: { type: String, enum: ['NET_AFTER_EXPENSES', 'GROSS_LESS_COMMISSION'], default: 'NET_AFTER_EXPENSES' },
    status: { type: String, enum: ['ACTIVE', 'EXPIRED', 'TERMINATED'], default: 'ACTIVE', index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

const ManagementContract = mongoose.model('ManagementContract', mgmtSchema);
module.exports = { ManagementContract };
