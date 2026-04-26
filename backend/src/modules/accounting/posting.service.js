const { GLEntry } = require('./glEntry.model');
const { Account, getByCode } = require('./account.model');
const { fiscalYearName, ensureFiscalYearFor } = require('./fiscalYear.model');
const ApiError = require('../../shared/utils/ApiError');

const round = (n) => Math.round(Number(n || 0) * 100) / 100;

/**
 * Validate + persist GL entries for one posting set.
 *
 * @param {Object} ctx
 * @param {Date}   ctx.postingDate
 * @param {String} ctx.voucherType   one of GLEntry VOUCHER_TYPES
 * @param {String} ctx.voucherNo     human-readable doc number
 * @param {ObjectId} ctx.voucherId
 * @param {String} [ctx.remarks]
 * @param {Boolean} [ctx.isReversal]
 * @param {Array}  ctx.lines         each: { account, debit, credit, party?, partyId?, partyName?, property?, remarks? }
 *
 * Enforces:
 *  - Σ debit == Σ credit (balance)
 *  - account exists, is a ledger (not group), is enabled
 *  - if account.partyType is set, line must carry the matching party
 */
async function postEntries(ctx) {
  const { postingDate, voucherType, voucherNo, voucherId, remarks = '', isReversal = false, lines = [] } = ctx;

  if (!Array.isArray(lines) || lines.length < 2) {
    throw ApiError.badRequest('Posting must have at least 2 lines');
  }

  // Resolve accounts and validate
  const codes = [...new Set(lines.map((l) => String(l.account)))];
  const accounts = await Account.find({ code: { $in: codes } }).lean();
  const byCode = new Map(accounts.map((a) => [a.code, a]));

  for (const code of codes) {
    const a = byCode.get(code);
    if (!a) throw ApiError.badRequest(`Unknown account: ${code}`);
    if (a.isGroup) throw ApiError.badRequest(`Cannot post to group account: ${code} (${a.name})`);
    if (a.disabled) throw ApiError.badRequest(`Account is disabled: ${code} (${a.name})`);
  }

  // Balance check
  const totalDebit = round(lines.reduce((s, l) => s + Number(l.debit || 0), 0));
  const totalCredit = round(lines.reduce((s, l) => s + Number(l.credit || 0), 0));
  if (totalDebit !== totalCredit) {
    throw ApiError.badRequest(
      `Unbalanced posting (Dr ${totalDebit} ≠ Cr ${totalCredit}) for ${voucherType} ${voucherNo}`
    );
  }
  if (totalDebit === 0) throw ApiError.badRequest('Posting amount cannot be zero');

  await ensureFiscalYearFor(postingDate);
  const fy = fiscalYearName(postingDate);

  // For each line, validate party/account compatibility
  for (const l of lines) {
    const a = byCode.get(String(l.account));
    if (a.partyType) {
      if (!l.party || !l.partyId) {
        throw ApiError.badRequest(
          `Account ${a.code} (${a.name}) requires a ${a.partyType} party on every posting line`
        );
      }
      if (l.party !== a.partyType) {
        throw ApiError.badRequest(
          `Account ${a.code} requires party=${a.partyType}, got ${l.party}`
        );
      }
    }
    if ((Number(l.debit || 0) > 0 && Number(l.credit || 0) > 0) ||
        (Number(l.debit || 0) === 0 && Number(l.credit || 0) === 0)) {
      throw ApiError.badRequest(`Each GL line must have exactly one of debit/credit > 0 (account ${l.account})`);
    }
  }

  // "Against accounts" — peer accounts within the same posting (ERPNext-style)
  const peerCodes = [...new Set(codes)];

  // Persist
  const docs = lines.map((l) => {
    const a = byCode.get(String(l.account));
    return {
      postingDate,
      fiscalYear: fy,
      account: a.code,
      accountName: a.name,
      rootType: a.rootType,
      debit: round(l.debit || 0),
      credit: round(l.credit || 0),
      party: l.party || null,
      partyId: l.partyId || null,
      partyName: l.partyName || '',
      property: l.property || null,
      voucherType,
      voucherNo,
      voucherId: voucherId || null,
      againstAccounts: peerCodes.filter((c) => c !== a.code).join(','),
      remarks: l.remarks || remarks,
      isReversal,
    };
  });

  return GLEntry.insertMany(docs);
}

/**
 * Cancel a voucher: write a reversing batch (debit/credit swapped) for every
 * non-cancelled GL entry of that voucher, mark originals + reversal cancelled.
 */
async function cancelVoucher({ voucherType, voucherId, postingDate = new Date(), remarks = '' }) {
  const originals = await GLEntry.find({ voucherType, voucherId, isCancelled: false }).lean();
  if (originals.length === 0) return [];

  const reversed = await postEntries({
    postingDate,
    voucherType,
    voucherNo: `${originals[0].voucherNo}-CANCEL`,
    voucherId,
    remarks: remarks || `Cancellation of ${originals[0].voucherNo}`,
    isReversal: true,
    lines: originals.map((o) => ({
      account: o.account,
      debit: o.credit,
      credit: o.debit,
      party: o.party,
      partyId: o.partyId,
      partyName: o.partyName,
      property: o.property,
      remarks: `Reversal: ${o.remarks || ''}`,
    })),
  });

  await GLEntry.updateMany({ _id: { $in: originals.map((o) => o._id) } }, { $set: { isCancelled: true } });
  await GLEntry.updateMany({ _id: { $in: reversed.map((r) => r._id) } }, { $set: { isCancelled: true } });

  return reversed;
}

module.exports = { postEntries, cancelVoucher };
