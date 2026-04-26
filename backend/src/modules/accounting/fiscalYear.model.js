const mongoose = require('mongoose');

const fiscalYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // e.g. "2026"
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    closed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const FiscalYear = mongoose.model('FiscalYear', fiscalYearSchema);

async function ensureFiscalYearFor(date = new Date()) {
  const y = new Date(date).getFullYear();
  const name = String(y);
  const existing = await FiscalYear.findOne({ name }).lean();
  if (existing) return existing;
  return (
    await FiscalYear.create({
      name,
      start: new Date(`${y}-01-01T00:00:00.000Z`),
      end: new Date(`${y}-12-31T23:59:59.999Z`),
    })
  ).toObject();
}

function fiscalYearName(date = new Date()) {
  return String(new Date(date).getFullYear());
}

module.exports = { FiscalYear, ensureFiscalYearFor, fiscalYearName };
