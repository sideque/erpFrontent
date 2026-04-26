/**
 * Manual Journal Entry — service layer.
 *
 * Mirrors ERPNext's "Journal Entry" doctype. Each JE document represents one
 * balanced posting. On creation we both persist the JE document AND post one
 * GL Entry per line via the central posting service.
 */

const { JournalEntry } = require('./journal.model');
const { Account } = require('./account.model');
const { GLEntry } = require('./glEntry.model');
const posting = require('./posting.service');
const ApiError = require('../../shared/utils/ApiError');

async function nextNumber() {
  const seq = (await JournalEntry.countDocuments()) + 1;
  return `JV-${new Date().getFullYear()}-${String(seq).padStart(6, '0')}`;
}

/**
 * Create + post a Journal Entry.
 *
 * @param {Object} input
 * @param {String} [input.type]         JE type (default JOURNAL_ENTRY)
 * @param {Date}   input.postingDate
 * @param {String} [input.title]
 * @param {String} [input.memo]
 * @param {Array}  input.lines          [{ accountCode, debit, credit, party?, partyId?, partyName?, property?, remarks? }]
 * @param {ObjectId} [createdBy]
 */
async function create(input, createdBy) {
  if (!Array.isArray(input.lines) || input.lines.length < 2) {
    throw ApiError.badRequest('Journal entry needs at least 2 lines');
  }

  // Resolve account names from codes for snapshotting on the document.
  const codes = [...new Set(input.lines.map((l) => String(l.accountCode)))];
  const accounts = await Account.find({ code: { $in: codes } }).lean();
  const byCode = new Map(accounts.map((a) => [a.code, a]));
  for (const code of codes) {
    if (!byCode.has(code)) throw ApiError.badRequest(`Unknown account: ${code}`);
  }

  const number = await nextNumber();
  const enrichedLines = input.lines.map((l) => ({
    accountCode: l.accountCode,
    accountName: byCode.get(l.accountCode).name,
    debit: Number(l.debit || 0),
    credit: Number(l.credit || 0),
    party: l.party || null,
    partyId: l.partyId || null,
    partyName: l.partyName || '',
    property: l.property || null,
    remarks: l.remarks || '',
  }));

  // Persist the JE document first (its pre-validate hook re-checks balance).
  const je = await JournalEntry.create({
    number,
    type: input.type || 'JOURNAL_ENTRY',
    postingDate: input.postingDate ? new Date(input.postingDate) : new Date(),
    title: input.title || '',
    memo: input.memo || '',
    lines: enrichedLines,
    status: 'POSTED',
    createdBy,
  });

  // Post to the General Ledger. If posting fails (e.g. group-account violation,
  // missing party on AR), roll back the JE document so we don't leave orphans.
  try {
    await posting.postEntries({
      postingDate: je.postingDate,
      voucherType: 'JOURNAL_ENTRY',
      voucherNo: je.number,
      voucherId: je._id,
      remarks: je.memo || je.title,
      lines: enrichedLines.map((l) => ({
        account: l.accountCode,
        debit: l.debit,
        credit: l.credit,
        party: l.party,
        partyId: l.partyId,
        partyName: l.partyName,
        property: l.property,
        remarks: l.remarks,
      })),
    });
  } catch (err) {
    await JournalEntry.deleteOne({ _id: je._id });
    throw err;
  }

  return je;
}

async function get(id) {
  const je = await JournalEntry.findById(id).lean();
  if (!je) throw ApiError.notFound('Journal entry not found');
  const glEntries = await GLEntry.find({ voucherType: 'JOURNAL_ENTRY', voucherId: je._id }).sort({ createdAt: 1 }).lean();
  return { ...je, glEntries };
}

async function list(query = {}) {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.postingDate = {};
    if (query.from) filter.postingDate.$gte = new Date(query.from);
    if (query.to) filter.postingDate.$lte = new Date(query.to);
  }
  return JournalEntry.find(filter).sort({ postingDate: -1, createdAt: -1 }).limit(100).lean();
}

async function cancel(id) {
  const je = await JournalEntry.findById(id);
  if (!je) throw ApiError.notFound('Journal entry not found');
  if (je.status === 'CANCELLED') throw ApiError.badRequest('Already cancelled');

  await posting.cancelVoucher({
    voucherType: 'JOURNAL_ENTRY',
    voucherId: je._id,
    remarks: `Cancellation of ${je.number}`,
  });

  je.status = 'CANCELLED';
  await je.save();
  return je;
}

module.exports = { create, get, list, cancel };
