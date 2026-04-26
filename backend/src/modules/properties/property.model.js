const mongoose = require('mongoose');

const PROPERTY_TYPES = ['APARTMENT', 'VILLA', 'OFFICE', 'LAND'];
const PROPERTY_STATUS = ['AVAILABLE', 'RENTED', 'UNDER_MAINTENANCE'];

const ownershipSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: PROPERTY_TYPES, required: true, index: true },
    status: { type: String, enum: PROPERTY_STATUS, default: 'AVAILABLE', index: true },
    location: {
      area: { type: String, default: '' },
      community: { type: String, default: '' },
      address: { type: String, default: '' },
      city: { type: String, default: 'Dubai' },
    },
    sizeSqm: { type: Number, default: 0 },
    bedrooms: { type: Number, default: 0 },
    bathrooms: { type: Number, default: 0 },
    units: { type: Number, default: 1 },
    rentEstimate: { type: Number, default: 0 },
    description: { type: String, default: '' },
    images: [{ type: String }],
    documents: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
    owners: [ownershipSchema],
  },
  { timestamps: true }
);

propertySchema.index({ name: 'text', 'location.area': 'text', 'location.community': 'text' });

const Property = mongoose.model('Property', propertySchema);
module.exports = { Property, PROPERTY_TYPES, PROPERTY_STATUS };
