const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM', index: true },
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    assigneeName: String,
    vendor: String,
    estimatedCost: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    reportedAt: { type: Date, default: Date.now },
    resolvedAt: Date,
  },
  { timestamps: true }
);

const MaintenanceTicket = mongoose.model('MaintenanceTicket', ticketSchema);
module.exports = { MaintenanceTicket };
