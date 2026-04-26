# 📚 Vantus ERP — Accounting Design (ERPNext-style)

> **Goal:** model accounting exactly like a real ERP (ERPNext / Odoo / Tally),
> not like a toy app. Every business document (invoice, payment, expense, owner
> settlement) becomes a posting against a **double-entry General Ledger**.
>
> This document is the contract between business logic and the ledger. **Every
> module that creates financial movement must read it.**

---

## 1. Foundational concepts

### 1.1 The five account types (Root types)

Every account in the system belongs to **exactly one** of these:

| Root Type    | Normal balance | Examples                          |
|--------------|----------------|-----------------------------------|
| `ASSET`      | Debit          | Cash, Bank, Receivables           |
| `LIABILITY`  | Credit         | Security Deposits, Owner Payable  |
| `EQUITY`     | Credit         | Retained Earnings, Owner's Capital|
| `INCOME`     | Credit         | Rent Income, Commission Income    |
| `EXPENSE`    | Debit          | Maintenance, Utilities, Vendors   |

Each root type also maps to a **Report Type**:
- `BALANCE_SHEET` → ASSET, LIABILITY, EQUITY
- `PROFIT_AND_LOSS` → INCOME, EXPENSE

### 1.2 Hierarchical Chart of Accounts

Like ERPNext, the chart is **a tree**:
- **Group accounts** (`isGroup: true`) — parents only, no postings allowed.
- **Ledger accounts** (`isGroup: false`) — leaves; only these can be posted to.

Sample tree:

```
1000 — Application of Funds (Assets) [GROUP, ASSET]
  ├─ 1100 — Current Assets [GROUP, ASSET]
  │   ├─ 1110 — Cash on Hand [LEDGER]
  │   ├─ 1120 — Bank — Operating [LEDGER]
  │   └─ 1130 — Accounts Receivable — Rent [LEDGER, partyType: TENANT]
  └─ ...
2000 — Source of Funds (Liabilities) [GROUP, LIABILITY]
  ├─ 2100 — Current Liabilities [GROUP, LIABILITY]
  │   ├─ 2110 — Security Deposits Held [LEDGER]
  │   └─ 2120 — Owner Payable [LEDGER, partyType: OWNER]
3000 — Equity [GROUP, EQUITY]
  └─ 3100 — Retained Earnings [LEDGER]
4000 — Income [GROUP, INCOME]
  ├─ 4100 — Rent Income [LEDGER]
  └─ 4200 — Commission Income [LEDGER]
5000 — Expense [GROUP, EXPENSE]
  ├─ 5100 — Maintenance Expense [LEDGER]
  ├─ 5200 — Utility Expense [LEDGER]
  ├─ 5300 — Vendor Expense [LEDGER]
  └─ 5900 — Other Expense [LEDGER]
```

### 1.3 Party accounts (sub-ledgers)

Like ERPNext's "Party Account":
- **AR (1130)** is sub-ledgered by **Tenant** (party type = `TENANT`).
- **AP / Owner Payable (2120)** is sub-ledgered by **Owner** (party type = `OWNER`).

That means a posting to AR always carries `(party='Tenant', partyId=…)`. We can
then compute receivables per tenant, aging buckets, etc.

### 1.4 Accounting dimensions

In addition to `account` + `party`, every GL Entry can carry:
- `property` — like ERPNext's "Cost Center"; lets us run **property-wise P&L**.
- `voucherType` + `voucherNo` — backref to the originating document.

---

## 2. Documents that post to the ledger

A **document** is the user-facing record. **Posting** is the act of writing GL
Entries when the document is submitted. A document never edits the ledger
directly — it goes through `accounting.service.postDocument(...)`.

| Document            | Trigger                                           | What gets posted |
|---------------------|---------------------------------------------------|------------------|
| Sales Invoice (rent invoice)        | Created (status = SUBMITTED) | Dr AR (party=Tenant) / Cr Rent Income |
| Sales Invoice (security deposit)    | Created                       | Dr AR / Cr Security Deposits Held (liability) |
| Payment Entry (Receive)             | Recorded                      | Dr Cash/Bank / Cr AR (party=Tenant)   |
| Purchase Invoice / Expense          | Created                       | Dr Expense / Cr Cash/Bank             |
| Owner Settlement                    | "Pay Out" pressed             | Dr Owner Payable (party=Owner) / Cr Bank · then split commission |
| Journal Entry (manual)              | Posted by accountant          | Whatever lines the user enters (must balance) |

Every posting **must balance**: `Σ debits = Σ credits`. This is enforced at the
model level — unbalanced documents are rejected.

---

## 3. The GL Entry — the atom of the ledger

The single source of truth is the **`GLEntry`** collection. One row per
account-hit per voucher.

```js
{
  postingDate: Date,             // financial date (may differ from createdAt)
  account: '1130',               // account code (denormalised)
  accountName: 'Accounts Receivable — Rent',
  rootType: 'ASSET',             // copied from account
  debit: Number,                 // exactly one of debit/credit > 0
  credit: Number,
  party: 'TENANT' | 'OWNER' | null,
  partyId: ObjectId | null,
  property: ObjectId | null,     // dimension: cost center
  voucherType: 'SALES_INVOICE' | 'PAYMENT_ENTRY' | 'PURCHASE_INVOICE' | 'JOURNAL_ENTRY' | 'OWNER_SETTLEMENT',
  voucherNo: 'INV-2026-00001',
  voucherId: ObjectId,
  remarks: String,
  fiscalYear: '2026',
  isCancelled: Boolean,          // soft-delete (cancellation creates reversal)
}
```

### Why one row per hit (not one row per voucher)?
Because reports query by `account` + `party` + `property` + date range. A flat
table is dramatically faster than scanning JSON line arrays in every query.

### Why keep `JournalEntry` as a separate (header) document?
- A "Journal Entry" is a **document type** users see (manual journals).
- The atomic ledger row is **GL Entry**.
- Internally, every document type generates GL Entries — `JournalEntry` is just
  one of them.

This mirrors ERPNext's `tabGL Entry` table.

---

## 4. Cancellation & reversal

Like ERPNext: GL Entries are **immutable**. To undo a voucher you:
1. Cancel the document (`isCancelled = true`).
2. The accounting service creates a **reversing entry** with the same
   amounts but debit/credit swapped, dated today.

This preserves the audit trail. There is **no** "delete from ledger".

---

## 5. Fiscal Year

A `FiscalYear` document defines a date range (e.g. `2026-01-01 → 2026-12-31`).
Every GL Entry is stamped with its fiscal year. At year-end, a **Period
Closing** entry zeroes Income and Expense accounts into Retained Earnings:

```
Dr Rent Income           480,000
Dr Commission Income      48,000
   Cr Maintenance Expense        82,000
   Cr Utility Expense            14,000
   Cr Retained Earnings         432,000     ← profit goes to equity
```

---

## 6. Real-estate workflow → ledger postings

The full ERP flow with **exact** journal entries.

### 6.1 New tenancy contract → 12 invoices generated

For each invoice (monthly rent example, 10,000 AED):

```
Posting: SALES_INVOICE INV-2026-00001
  Dr 1130  Accounts Receivable — Rent       10,000   party=Tenant#42 property=P#7
  Cr 4100  Rent Income                              10,000   property=P#7
```

### 6.2 Tenant pays via bank transfer

```
Posting: PAYMENT_ENTRY PAY-2026-00001
  Dr 1120  Bank — Operating                  10,000
  Cr 1130  Accounts Receivable — Rent               10,000   party=Tenant#42 property=P#7
```

After (1) and (2), AR balance for Tenant#42 = 0. Bank +10,000. Income +10,000.

### 6.3 Security deposit on contract start

```
Posting: SALES_INVOICE (type=SECURITY_DEPOSIT)
  Dr 1130  Accounts Receivable — Rent        5,000   party=Tenant#42 property=P#7
  Cr 2110  Security Deposits Held                    5,000   property=P#7
```

When tenant pays the deposit, same AR knock-down as 6.2. The 2110 liability
sits on the Balance Sheet until move-out.

### 6.4 Tenant moves out → return deposit

```
Posting: PAYMENT_ENTRY (refund)
  Dr 2110  Security Deposits Held            5,000   property=P#7
  Cr 1120  Bank — Operating                          5,000
```

### 6.5 Maintenance expense paid by company

```
Posting: PURCHASE_INVOICE EXP-2026-00012
  Dr 5100  Maintenance Expense               1,200   property=P#7  remarks="AC repair"
  Cr 1120  Bank — Operating                          1,200
```

### 6.6 Owner statement & payout

End-of-month for Owner#5, Property P#7 (owns 100%):
- Gross income (4100) for property P#7 in month: **30,000**
- Expenses (5xxx) for property P#7 in month: **3,500**
- Management commission @ 7% of gross: **2,100**
- Net payout to owner: 30,000 − 3,500 − 2,100 = **24,400**

Two postings:

**A. Recognise commission earned (transferring from owner-borne pool)**
```
Posting: OWNER_SETTLEMENT OS-2026-00007 (commission leg)
  Dr 2120  Owner Payable                     2,100   party=Owner#5 property=P#7
  Cr 4200  Commission Income                          2,100   property=P#7
```

**B. Pay out the net to owner**
```
Posting: OWNER_SETTLEMENT OS-2026-00007 (payout leg)
  Dr 2120  Owner Payable                    24,400   party=Owner#5 property=P#7
  Cr 1120  Bank — Operating                          24,400
```

Owner Payable for the property is now zero. Bank −24,400. Commission +2,100.

> ⚠️ Implementation note: in v1 we keep the owner-payable accrual implicit
> (the income belongs to the owner, the company is just collecting). When we
> want full bookkeeping, we'd add a third leg at invoice time:
> `Dr Rent Income / Cr Owner Payable` per ownership %.

---

## 7. Reports

| Report               | Source                          | Filters                         |
|----------------------|---------------------------------|---------------------------------|
| **General Ledger**   | `GLEntry`                       | account, party, property, dates |
| **Trial Balance**    | `GLEntry` grouped by account    | dates                           |
| **Profit & Loss**    | `GLEntry` rootType ∈ {INCOME, EXPENSE} | dates, property         |
| **Balance Sheet**    | `GLEntry` rootType ∈ {ASSET, LIABILITY, EQUITY} | as-of date     |
| **Cash Flow**        | Movements on cash/bank accounts | dates                           |
| **Receivables Aging**| AR ledger by tenant, bucketed   | as-of date                      |
| **Property P&L**     | Filter by `property` dimension  | dates                           |
| **Owner Statement**  | Filter by property + period     | period, owner                   |

---

## 8. Numbering

Each voucher type has its own monotonic counter, prefixed by year:

| Document        | Format                |
|-----------------|-----------------------|
| Sales Invoice   | `INV-2026-00001`      |
| Payment Entry   | `PAY-2026-00001`      |
| Purchase Invoice / Expense | `EXP-2026-00001` |
| Journal Entry   | `JE-2026-000001`      |
| Owner Statement | `OS-2026-00001`       |

GL Entries do not have their own number — they reference the voucher.

---

## 9. Validation rules (enforced server-side)

1. **Balance**: a posting set must satisfy `Σ debit == Σ credit` (cents-rounded).
2. **No posting to group accounts**: rejected with 400.
3. **Account exists**: code must resolve to a non-cancelled account.
4. **Party type matches account**: posting to AR requires `party='TENANT'`.
5. **Cannot edit posted GL Entry**: only cancellation + reversal allowed.
6. **Date sanity**: `postingDate` must fall in an unclosed fiscal year.

---

## 10. What this replaces in MVP v1

The current implementation has:
- A flat `JournalEntry` model with embedded `lines[]`.
- Cash-basis posting (income at payment, not at invoice).
- No party sub-ledger, no aging report.

The upgrade keeps `JournalEntry` for **manual journals** but introduces:
- `Account` with `isGroup`, `parent`, `rootType`, `reportType`.
- `GLEntry` as the atomic ledger row.
- **Accrual basis**: invoices post AR; payments knock it down.
- Party-aware AR/AP for tenants & owners.
- Report endpoints: `general-ledger`, `balance-sheet`, `aging`, `cash-flow`.
- Reversals on cancellation.

---

## 11. File map (after refactor)

```
backend/src/modules/accounting/
├── account.model.js           # hierarchical chart
├── glEntry.model.js           # NEW — atomic ledger row
├── journal.model.js           # JE document header (manual journals)
├── ownerStatement.model.js
├── fiscalYear.model.js        # NEW
├── posting.service.js         # NEW — single function postDocument(...)
├── reports.service.js         # NEW — gl, tb, pnl, balance-sheet, aging
├── accounting.service.js      # public API surface, delegates to above
└── accounting.routes.js       # endpoints
```

---

## 12. Migration & seed

The seed script:
1. Creates the chart of accounts as a tree (group + ledger).
2. Creates the current fiscal year.
3. Drops legacy GL entries and re-posts everything from documents:
   - Each tenancy contract → invoice GL postings (accrual).
   - Each historic payment → payment GL postings.
   - Each expense → expense GL postings.
   - Each owner statement marked PAID → settlement postings.

Result: trial balance is zero-out balanced and reports tie out exactly to
documents.
