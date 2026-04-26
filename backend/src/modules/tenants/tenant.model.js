const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    nationality: { type: String, default: 'UAE' },
    occupation: { type: String, default: '' },
    employer: { type: String, default: '' },
    idType: { type: String, enum: ['EMIRATES_ID', 'PASSPORT'], default: 'EMIRATES_ID' },
    idNumber: { type: String, trim: true },
    idImage: { type: String, default: '' },
    address: { type: String, default: '' },
    avatar: { type: String, default: '' },
    notes: { type: String, default: '' },
    blacklisted: { type: Boolean, default: false, index: true },
    blacklistReason: { type: String, default: '' },
    riskTag: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
  },
  { timestamps: true }
);

tenantSchema.index({ name: 'text', email: 'text', phone: 'text' });

const Tenant = mongoose.model('Tenant', tenantSchema);
module.exports = { Tenant };
