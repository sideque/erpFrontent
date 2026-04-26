const mongoose = require('mongoose');

const STAGES = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    propertyType: { type: String, enum: ['APARTMENT', 'VILLA', 'OFFICE', 'LAND'] },
    targetProperty: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    source: { type: String, enum: ['WEBSITE', 'WALK_IN', 'REFERRAL', 'PORTAL', 'OTHER'], default: 'WEBSITE' },
    stage: { type: String, enum: STAGES, default: 'NEW', index: true },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nextFollowUp: Date,
    notes: { type: String, default: '' },
    history: [
      {
        stage: { type: String, enum: STAGES },
        at: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

const Lead = mongoose.model('Lead', leadSchema);
module.exports = { Lead, STAGES };
