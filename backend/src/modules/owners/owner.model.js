const mongoose = require('mongoose');

const ownerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, index: true },
    nationality: { type: String, default: 'UAE' },
    idType: { type: String, enum: ['EMIRATES_ID', 'PASSPORT'], default: 'EMIRATES_ID' },
    idNumber: { type: String, trim: true },
    idImage: { type: String, default: '' },
    address: { type: String, default: '' },
    bankAccount: {
      bankName: { type: String, default: '' },
      iban: { type: String, default: '' },
      accountName: { type: String, default: '' },
    },
    avatar: { type: String, default: '' },
    notes: { type: String, default: '' },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ownerSchema.index({ name: 'text', email: 'text', phone: 'text' });

const Owner = mongoose.model('Owner', ownerSchema);
module.exports = { Owner };
