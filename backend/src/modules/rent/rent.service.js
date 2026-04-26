const { Invoice } = require('./invoice.model');
const { Payment } = require('./payment.model');
const { TenancyContract } = require('../tenancy-contracts/tenancyContract.model');
const { Tenant } = require('../tenants/tenant.model');
const ApiError = require('../../shared/utils/ApiError');
const { paginate } = require('../../shared/utils/paginate');
const accountingService = require('../accounting/accounting.service');

const SCHEDULE_MONTHS = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function nextInvoiceNumber(seq) {
  const yyyy = new Date().getFullYear();
  return `INV-${yyyy}-${String(seq).padStart(5, '0')}`;
}

async function generateInvoicesForContract(contract) {
  const months = SCHEDULE_MONTHS[contract.paymentSchedule] || 1;
  const annualRent = Number(contract.annualRent || 0);
  const periodAmount = (annualRent / 12) * months;

  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);

  const invoiceDocs = [];
  let cursor = new Date(start);
  let i = 0;
  while (cursor < end) {
    const periodEnd = addMonths(cursor, months);
    const dueDate = new Date(cursor);
    const lastSeq = await Invoice.countDocuments();
    const number = nextInvoiceNumber(lastSeq + invoiceDocs.length + 1);
    const label = `${cursor.toLocaleString('en-US', { month: 'short' })} ${cursor.getFullYear()}${
      months > 1 ? ` – ${addMonths(cursor, months - 1).toLocaleString('en-US', { month: 'short' })} ${addMonths(cursor, months - 1).getFullYear()}` : ''
    }`;
    invoiceDocs.push({
      number,
      contract: contract._id,
      property: contract.property,
      tenant: contract.tenant,
      type: 'RENT',
      period: { label, start: new Date(cursor), end: periodEnd },
      issueDate: new Date(cursor),
      dueDate,
      amount: Math.round(periodAmount),
      status: 'PENDING',
    });
    cursor = periodEnd;
    if (++i > 240) break;
  }

  if (Number(contract.securityDeposit) > 0) {
    const lastSeq = await Invoice.countDocuments();
    invoiceDocs.push({
      number: nextInvoiceNumber(lastSeq + invoiceDocs.length + 1),
      contract: contract._id,
      property: contract.property,
      tenant: contract.tenant,
      type: 'SECURITY_DEPOSIT',
      period: { label: 'Security Deposit', start: contract.startDate, end: contract.startDate },
      issueDate: contract.startDate,
      dueDate: contract.startDate,
      amount: contract.securityDeposit,
      status: 'PENDING',
    });
  }

  // Persist invoices first (so we have _ids for GL voucherIds)
  const created = await Invoice.insertMany(invoiceDocs);

  // Accrual basis: post each invoice to the GL on creation.
  // Dr  AR (party=Tenant)
  // Cr  Rent Income / Security Deposits Held
  const tenant = await Tenant.findById(contract.tenant).select('name').lean();
  const tenantName = tenant?.name || '';
  for (const inv of created) {
    await accountingService.postSalesInvoice(inv, tenantName);
  }

  await TenancyContract.findByIdAndUpdate(contract._id, { invoicesGenerated: true });
  return created.length;
}

async function refreshOverdue() {
  const today = new Date();
  await Invoice.updateMany(
    { status: 'PENDING', dueDate: { $lt: today } },
    { $set: { status: 'OVERDUE' } }
  );
}

async function listInvoices(query) {
  await refreshOverdue();
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.tenant) filter.tenant = query.tenant;
  if (query.property) filter.property = query.property;
  if (query.contract) filter.contract = query.contract;
  if (query.type) filter.type = query.type;

  const r = await paginate(Invoice, filter, query, {
    sort: { dueDate: 1 },
    populate: [
      { path: 'tenant', select: 'name email phone' },
      { path: 'property', select: 'code name' },
      { path: 'contract', select: 'code annualRent paymentSchedule' },
    ],
  });
  return r;
}

async function getInvoice(id) {
  const inv = await Invoice.findById(id)
    .populate('tenant')
    .populate('property')
    .populate('contract')
    .lean({ virtuals: true });
  if (!inv) throw ApiError.notFound('Invoice not found');
  const payments = await Payment.find({ invoice: id }).sort({ paidAt: -1 }).lean();
  return { ...inv, payments };
}

async function recordPayment({ invoiceId, amount, method, reference, notes, paidAt, recordedBy }) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) throw ApiError.notFound('Invoice not found');
  if (invoice.status === 'CANCELLED') throw ApiError.badRequest('Cannot pay a cancelled invoice');

  const balance = invoice.amount - invoice.paidAmount;
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  if (amount > balance + 0.01) throw ApiError.badRequest(`Amount exceeds outstanding balance (${balance})`);

  const seq = (await Payment.countDocuments()) + 1;
  const number = `PAY-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;

  const payment = await Payment.create({
    number,
    invoice: invoice._id,
    contract: invoice.contract,
    property: invoice.property,
    tenant: invoice.tenant,
    amount,
    method,
    reference,
    notes,
    paidAt: paidAt || new Date(),
    recordedBy,
  });

  invoice.paidAmount = Number((invoice.paidAmount + amount).toFixed(2));
  if (invoice.paidAmount + 0.01 >= invoice.amount) invoice.status = 'PAID';
  else invoice.status = 'PARTIAL';
  await invoice.save();

  const tenant = await Tenant.findById(invoice.tenant).select('name').lean();
  await accountingService.postPayment({ invoice, payment, tenantName: tenant?.name || '' });

  return { invoice: await getInvoice(invoice._id), payment };
}

async function listPayments(query) {
  const filter = {};
  if (query.tenant) filter.tenant = query.tenant;
  if (query.property) filter.property = query.property;
  if (query.method) filter.method = query.method;
  return paginate(Payment, filter, query, {
    sort: { paidAt: -1 },
    populate: [
      { path: 'invoice', select: 'number amount type period' },
      { path: 'tenant', select: 'name' },
      { path: 'property', select: 'code name' },
    ],
  });
}

async function rentDashboard() {
  await refreshOverdue();
  const [totals, monthly, overdue] = await Promise.all([
    Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
          paid: { $sum: '$paidAmount' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { paidAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 11, 1)) } } },
      {
        $group: {
          _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
    ]),
    Invoice.find({ status: 'OVERDUE' }).countDocuments(),
  ]);

  const byStatus = totals.reduce(
    (a, x) => ({ ...a, [x._id]: { count: x.count, amount: x.amount, paid: x.paid } }),
    {}
  );
  return { byStatus, monthly, overdue };
}

module.exports = {
  generateInvoicesForContract,
  listInvoices,
  getInvoice,
  recordPayment,
  listPayments,
  rentDashboard,
  refreshOverdue,
};
