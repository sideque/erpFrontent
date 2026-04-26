const router = require('express').Router();
const { auth } = require('../../shared/middleware/auth');
const { ok } = require('../../shared/utils/response');
const { Property } = require('../properties/property.model');
const { Tenant } = require('../tenants/tenant.model');
const { Owner } = require('../owners/owner.model');
const { Invoice } = require('../rent/invoice.model');
const { Payment } = require('../rent/payment.model');
const { Expense } = require('../expenses/expense.model');
const { TenancyContract } = require('../tenancy-contracts/tenancyContract.model');
const { MaintenanceTicket } = require('../maintenance/maintenance.model');
const accounting = require('../accounting/accounting.service');

router.use(auth);

router.get('/overview', async (_req, res) => {
  const [
    totalProperties,
    rentedProperties,
    availableProperties,
    underMaintenance,
    tenantCount,
    ownerCount,
    activeContracts,
    expiringContracts,
    overdueInvoices,
    paidThisMonth,
    expensesThisMonth,
    openTickets,
  ] = await Promise.all([
    Property.countDocuments(),
    Property.countDocuments({ status: 'RENTED' }),
    Property.countDocuments({ status: 'AVAILABLE' }),
    Property.countDocuments({ status: 'UNDER_MAINTENANCE' }),
    Tenant.countDocuments(),
    Owner.countDocuments(),
    TenancyContract.countDocuments({ status: 'ACTIVE' }),
    TenancyContract.countDocuments({
      status: 'ACTIVE',
      endDate: { $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) },
    }),
    Invoice.countDocuments({ status: 'OVERDUE' }),
    Payment.aggregate([
      { $match: { paidAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    MaintenanceTicket.countDocuments({ status: { $in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } }),
  ]);

  const occupancy = totalProperties ? Math.round((rentedProperties / totalProperties) * 100) : 0;

  // 12-month income vs expense series
  const start = new Date();
  start.setMonth(start.getMonth() - 11, 1);
  start.setHours(0, 0, 0, 0);

  const [paymentsAgg, expensesAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { paidAt: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
    Expense.aggregate([
      { $match: { date: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  const months = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(start);
    d.setMonth(start.getMonth() + i);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const key = `${y}-${m}`;
    const inc = paymentsAgg.find((p) => p._id.y === y && p._id.m === m)?.total || 0;
    const exp = expensesAgg.find((p) => p._id.y === y && p._id.m === m)?.total || 0;
    months.push({
      label: d.toLocaleString('en-US', { month: 'short' }) + ' ' + String(y).slice(2),
      income: inc,
      expense: exp,
      profit: inc - exp,
    });
  }

  const pnl = await accounting.companyPnl();

  res.json({
    success: true,
    data: {
      kpis: {
        totalProperties,
        rentedProperties,
        availableProperties,
        underMaintenance,
        occupancy,
        tenantCount,
        ownerCount,
        activeContracts,
        expiringContracts,
        overdueInvoices,
        paidThisMonth: paidThisMonth[0]?.total || 0,
        expensesThisMonth: expensesThisMonth[0]?.total || 0,
        openTickets,
        netProfit: pnl.profit,
        totalIncome: pnl.income + pnl.commission,
        totalExpense: pnl.expense,
      },
      months,
    },
  });
});

module.exports = router;
