const mongoose = require('mongoose');

/**
 * Hierarchical Chart of Accounts (ERPNext-style).
 *
 *  - rootType:     ASSET | LIABILITY | EQUITY | INCOME | EXPENSE
 *  - reportType:   BALANCE_SHEET | PROFIT_AND_LOSS  (derived from rootType)
 *  - isGroup:      true = parent group (no postings allowed),
 *                  false = ledger leaf (postable).
 *  - parent:       ObjectId of the parent group (null for root nodes).
 *  - partyType:    set on AR-style accounts to enforce sub-ledger discipline
 *                  (e.g. AR requires party=TENANT, Owner Payable requires party=OWNER).
 */

const ROOT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
const PARTY_TYPES = ['TENANT', 'OWNER'];

function reportTypeFor(rootType) {
  return rootType === 'INCOME' || rootType === 'EXPENSE' ? 'PROFIT_AND_LOSS' : 'BALANCE_SHEET';
}

const accountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    rootType: { type: String, enum: ROOT_TYPES, required: true, index: true },
    reportType: { type: String, enum: ['BALANCE_SHEET', 'PROFIT_AND_LOSS'], required: true, index: true },
    isGroup: { type: Boolean, default: false, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null, index: true },
    parentCode: { type: String, default: null },
    partyType: { type: String, enum: PARTY_TYPES, default: null },
    description: { type: String, default: '' },
    isSystem: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountSchema.pre('validate', function (next) {
  if (this.rootType) this.reportType = reportTypeFor(this.rootType);
  next();
});

const Account = mongoose.model('Account', accountSchema);

/**
 * Default Chart of Accounts. Order matters — groups created first so children
 * can resolve parentCode → ObjectId.
 */
const CHART = [
  // Top-level groups
  { code: '1000', name: 'Application of Funds (Assets)', rootType: 'ASSET', isGroup: true },
  { code: '2000', name: 'Source of Funds (Liabilities)', rootType: 'LIABILITY', isGroup: true },
  { code: '3000', name: 'Equity', rootType: 'EQUITY', isGroup: true },
  { code: '4000', name: 'Income', rootType: 'INCOME', isGroup: true },
  { code: '5000', name: 'Expense', rootType: 'EXPENSE', isGroup: true },

  // Asset sub-groups
  { code: '1100', name: 'Current Assets', rootType: 'ASSET', isGroup: true, parent: '1000' },

  // Asset ledger leaves
  { code: '1110', name: 'Cash on Hand', rootType: 'ASSET', isGroup: false, parent: '1100' },
  { code: '1120', name: 'Bank — Operating', rootType: 'ASSET', isGroup: false, parent: '1100' },
  { code: '1130', name: 'Accounts Receivable — Rent', rootType: 'ASSET', isGroup: false, parent: '1100', partyType: 'TENANT' },

  // Liability sub-groups
  { code: '2100', name: 'Current Liabilities', rootType: 'LIABILITY', isGroup: true, parent: '2000' },

  // Liability ledger leaves
  { code: '2110', name: 'Security Deposits Held', rootType: 'LIABILITY', isGroup: false, parent: '2100' },
  { code: '2120', name: 'Owner Payable', rootType: 'LIABILITY', isGroup: false, parent: '2100', partyType: 'OWNER' },

  // Equity ledger leaves
  { code: '3100', name: 'Retained Earnings', rootType: 'EQUITY', isGroup: false, parent: '3000' },

  // Income ledger leaves
  { code: '4100', name: 'Rent Income', rootType: 'INCOME', isGroup: false, parent: '4000' },
  { code: '4200', name: 'Commission Income', rootType: 'INCOME', isGroup: false, parent: '4000' },

  // Expense ledger leaves
  { code: '5100', name: 'Maintenance Expense', rootType: 'EXPENSE', isGroup: false, parent: '5000' },
  { code: '5200', name: 'Utility Expense', rootType: 'EXPENSE', isGroup: false, parent: '5000' },
  { code: '5300', name: 'Vendor Expense', rootType: 'EXPENSE', isGroup: false, parent: '5000' },
  { code: '5900', name: 'Other Expense', rootType: 'EXPENSE', isGroup: false, parent: '5000' },
];

async function ensureSystemAccounts() {
  const byCode = new Map();
  for (const def of CHART) {
    const parent = def.parent ? byCode.get(def.parent) : null;
    const update = {
      $setOnInsert: {
        code: def.code,
        name: def.name,
        rootType: def.rootType,
        reportType: reportTypeFor(def.rootType),
        isGroup: !!def.isGroup,
        parent: parent ? parent._id : null,
        parentCode: def.parent || null,
        partyType: def.partyType || null,
        isSystem: true,
      },
    };
    const doc = await Account.findOneAndUpdate({ code: def.code }, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    byCode.set(def.code, doc);
  }
}

async function getByCode(code) {
  return Account.findOne({ code }).lean();
}

module.exports = { Account, CHART, ROOT_TYPES, PARTY_TYPES, ensureSystemAccounts, getByCode, reportTypeFor };
