/* eslint-disable no-console */
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { User } = require('../modules/users/user.model');
const { Owner } = require('../modules/owners/owner.model');
const { Tenant } = require('../modules/tenants/tenant.model');
const { Property } = require('../modules/properties/property.model');
const { ManagementContract } = require('../modules/management-contracts/managementContract.model');
const { TenancyContract } = require('../modules/tenancy-contracts/tenancyContract.model');
const { Invoice } = require('../modules/rent/invoice.model');
const { Payment } = require('../modules/rent/payment.model');
const { Expense, CATEGORY_ACCOUNT } = require('../modules/expenses/expense.model');
const { MaintenanceTicket } = require('../modules/maintenance/maintenance.model');
const { Lead } = require('../modules/crm/lead.model');
const { Account, ensureSystemAccounts } = require('../modules/accounting/account.model');
const { JournalEntry } = require('../modules/accounting/journal.model');
const { GLEntry } = require('../modules/accounting/glEntry.model');
const { FiscalYear, ensureFiscalYearFor } = require('../modules/accounting/fiscalYear.model');
const { OwnerStatement } = require('../modules/accounting/ownerStatement.model');
const accounting = require('../modules/accounting/accounting.service');
const rentService = require('../modules/rent/rent.service');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const r = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

async function clearAll() {
  console.log('[seed] clearing collections…');
  await Promise.all(
    [
      User,
      Owner,
      Tenant,
      Property,
      ManagementContract,
      TenancyContract,
      Invoice,
      Payment,
      Expense,
      MaintenanceTicket,
      Lead,
      Account,
      JournalEntry,
      GLEntry,
      FiscalYear,
      OwnerStatement,
    ].map((m) => m.deleteMany({}))
  );
}

async function seedUsers() {
  console.log('[seed] users…');
  const data = [
    { name: 'Lila Thompson', email: 'admin@vantus.com', password: 'admin123', role: 'SUPER_ADMIN', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=47' },
    { name: 'Mia Johnson', email: 'mia@vantus.com', password: 'admin123', role: 'SUPER_ADMIN', access: 'READ_ONLY', avatar: 'https://i.pravatar.cc/120?img=49' },
    { name: 'Olivia Brown', email: 'olivia@vantus.com', password: 'admin123', role: 'SUPER_ADMIN', access: 'FULL_ACCESS', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=44' },
    { name: 'Chloe Anderson', email: 'manager@vantus.com', password: 'manager123', role: 'MANAGER', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=32' },
    { name: 'Ella Robinson', email: 'ella@vantus.com', password: 'manager123', role: 'MANAGER', access: 'LIMITED_ADMIN', avatar: 'https://i.pravatar.cc/120?img=20' },
    { name: 'Grace Hall', email: 'grace@vantus.com', password: 'manager123', role: 'MANAGER', access: 'LIMITED_ADMIN', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=24' },
    { name: 'Ava Martinez', email: 'accountant@vantus.com', password: 'accountant123', role: 'ACCOUNTANT', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=10' },
    { name: 'Isabella Garcia', email: 'isabella@vantus.com', password: 'accountant123', role: 'ACCOUNTANT', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=23' },
    { name: 'Sofia Lee', email: 'sofia@vantus.com', password: 'accountant123', role: 'ACCOUNTANT', access: 'READ_ONLY', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=29' },
    { name: 'Ethan Brooks', email: 'agent@vantus.com', password: 'agent123', role: 'AGENT', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=14' },
    { name: 'Jin Park', email: 'jin@vantus.com', password: 'agent123', role: 'AGENT', access: 'LIMITED_ADMIN', avatar: 'https://i.pravatar.cc/120?img=15' },
    { name: 'Tao Li', email: 'tao@vantus.com', password: 'agent123', role: 'AGENT', access: 'FULL_ACCESS', status: 'DISABLED', avatar: 'https://i.pravatar.cc/120?img=12' },
    { name: 'Sophie Klein', email: 'sophie@vantus.com', password: 'agent123', role: 'AGENT', access: 'FULL_ACCESS', avatar: 'https://i.pravatar.cc/120?img=45' },
  ];
  const out = [];
  for (const u of data) {
    const passwordHash = await User.hashPassword(u.password);
    out.push(await User.create({ ...u, passwordHash }));
  }
  return out;
}

async function seedOwners() {
  console.log('[seed] owners…');
  const data = [
    { name: 'Ahmed Al Maktoum', email: 'ahmed.maktoum@example.ae', phone: '+971501112233', nationality: 'UAE', idType: 'EMIRATES_ID', idNumber: '784-1985-1234567-1', verified: true, bankAccount: { bankName: 'Emirates NBD', iban: 'AE070331234567890123456', accountName: 'Ahmed Al Maktoum' }, avatar: 'https://i.pravatar.cc/120?img=68' },
    { name: 'Fatima Al Suwaidi', email: 'fatima.s@example.ae', phone: '+971502223344', nationality: 'UAE', idType: 'EMIRATES_ID', idNumber: '784-1990-7654321-2', verified: true, bankAccount: { bankName: 'ADCB', iban: 'AE070331234567890999000', accountName: 'Fatima Al Suwaidi' }, avatar: 'https://i.pravatar.cc/120?img=48' },
    { name: 'Rajesh Patel', email: 'rajesh@example.in', phone: '+971503334455', nationality: 'India', idType: 'PASSPORT', idNumber: 'M3456789', verified: true, bankAccount: { bankName: 'HSBC', iban: 'AE0703312345678AAAAAAA', accountName: 'Rajesh Patel' }, avatar: 'https://i.pravatar.cc/120?img=52' },
    { name: 'Linda Schmidt', email: 'linda@example.de', phone: '+971504445566', nationality: 'Germany', idType: 'PASSPORT', idNumber: 'C7891234', verified: false, avatar: 'https://i.pravatar.cc/120?img=5' },
  ];
  return Owner.insertMany(data);
}

async function seedTenants() {
  console.log('[seed] tenants…');
  const data = [
    { name: 'Mira Yilmaz', email: 'mira.yilmaz@clarionlabs.io', phone: '+971551234567', nationality: 'Turkey', occupation: 'Product Designer', employer: 'ClarionLabs', idType: 'PASSPORT', idNumber: 'TR12345678', riskTag: 'LOW', avatar: 'https://i.pravatar.cc/120?img=26' },
    { name: 'Ethan Brooks', email: 'ethan.brooks@eventures.com', phone: '+971552345678', nationality: 'UK', occupation: 'Engineer', employer: 'EVentures', idType: 'PASSPORT', idNumber: 'GB98765432', riskTag: 'LOW', avatar: 'https://i.pravatar.cc/120?img=14' },
    { name: 'Liu Zhang', email: 'liu.zhang@transysglobal.com', phone: '+971553456789', nationality: 'China', occupation: 'Consultant', employer: 'Transys', idType: 'PASSPORT', idNumber: 'CN77889900', riskTag: 'MEDIUM', avatar: 'https://i.pravatar.cc/120?img=33' },
    { name: 'Tao Li', email: 'tao.li@skychaintech.com', phone: '+971554567890', nationality: 'China', occupation: 'Manager', employer: 'Skychain', idType: 'PASSPORT', idNumber: 'CN11223344', riskTag: 'LOW', avatar: 'https://i.pravatar.cc/120?img=12' },
    { name: 'Sophie Klein', email: 'sophie.klein@brighmedia.com', phone: '+971555678901', nationality: 'France', occupation: 'Marketing Lead', employer: 'BrighMedia', idType: 'PASSPORT', idNumber: 'FR55667788', riskTag: 'LOW', avatar: 'https://i.pravatar.cc/120?img=45' },
    { name: 'Jin Park', email: 'jin.park@zenlogix.co', phone: '+971556789012', nationality: 'Korea', occupation: 'Developer', employer: 'Zenlogix', idType: 'PASSPORT', idNumber: 'KR66554433', riskTag: 'LOW', avatar: 'https://i.pravatar.cc/120?img=15' },
  ];
  return Tenant.insertMany(data);
}

async function seedProperties(owners) {
  console.log('[seed] properties…');
  const items = [
    { code: 'VAN-A101', name: 'Marina Heights — A101', type: 'APARTMENT', status: 'RENTED', location: { area: 'Dubai Marina', community: 'Marina Heights', city: 'Dubai' }, sizeSqm: 95, bedrooms: 2, bathrooms: 2, units: 1, rentEstimate: 110000, images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200'] },
    { code: 'VAN-A205', name: 'Burj Vista — 2BR', type: 'APARTMENT', status: 'RENTED', location: { area: 'Downtown', community: 'Burj Vista', city: 'Dubai' }, sizeSqm: 110, bedrooms: 2, bathrooms: 2, units: 1, rentEstimate: 145000, images: ['https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200'] },
    { code: 'VAN-V301', name: 'Palm Jumeirah Villa', type: 'VILLA', status: 'RENTED', location: { area: 'Palm Jumeirah', community: 'Frond E', city: 'Dubai' }, sizeSqm: 480, bedrooms: 5, bathrooms: 6, units: 1, rentEstimate: 650000, images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200'] },
    { code: 'VAN-O101', name: 'JLT Office Tower #18', type: 'OFFICE', status: 'AVAILABLE', location: { area: 'JLT', community: 'Cluster B', city: 'Dubai' }, sizeSqm: 220, bedrooms: 0, bathrooms: 2, units: 1, rentEstimate: 180000, images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'] },
    { code: 'VAN-A410', name: 'Damac Hills — 1BR', type: 'APARTMENT', status: 'AVAILABLE', location: { area: 'Damac Hills', community: 'Carson', city: 'Dubai' }, sizeSqm: 65, bedrooms: 1, bathrooms: 1, units: 1, rentEstimate: 75000, images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'] },
    { code: 'VAN-V402', name: 'Arabian Ranches Villa', type: 'VILLA', status: 'UNDER_MAINTENANCE', location: { area: 'Arabian Ranches', community: 'Mirador', city: 'Dubai' }, sizeSqm: 360, bedrooms: 4, bathrooms: 5, units: 1, rentEstimate: 280000, images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200'] },
  ];

  const out = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let ownersList;
    if (i % 3 === 0) ownersList = [{ owner: owners[0]._id, percentage: 100 }];
    else if (i % 3 === 1) ownersList = [{ owner: owners[1]._id, percentage: 60 }, { owner: owners[2]._id, percentage: 40 }];
    else ownersList = [{ owner: owners[3]._id, percentage: 100 }];
    out.push(await Property.create({ ...item, owners: ownersList }));
  }
  return out;
}

async function seedManagementContracts(properties, owners) {
  console.log('[seed] management contracts…');
  const out = [];
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const ownerIds = p.owners.map((o) => o.owner);
    out.push(
      await ManagementContract.create({
        code: `MC-${1000 + i}`,
        property: p._id,
        owners: ownerIds,
        commissionPct: pick([5, 7, 8, 10]),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2027-12-31'),
        expensesBornBy: 'OWNER',
        incomeRule: 'NET_AFTER_EXPENSES',
        status: 'ACTIVE',
      })
    );
  }
  return out;
}

async function seedTenanciesAndInvoices(properties, tenants) {
  console.log('[seed] tenancies + invoices…');
  const rentedProps = properties.filter((p) => p.status === 'RENTED');
  const contracts = [];
  for (let i = 0; i < rentedProps.length; i++) {
    const p = rentedProps[i];
    const tenant = tenants[i % tenants.length];
    const annual = p.rentEstimate;
    const start = new Date();
    start.setMonth(start.getMonth() - 8);
    start.setDate(1);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);

    const c = await TenancyContract.create({
      code: `TC-${2000 + i}`,
      property: p._id,
      tenant: tenant._id,
      annualRent: annual,
      paymentSchedule: pick(['MONTHLY', 'QUARTERLY']),
      securityDeposit: Math.round(annual * 0.05),
      startDate: start,
      endDate: end,
      moveInDate: start,
      status: 'ACTIVE',
      rules: 'No pets. No smoking inside.',
    });
    await rentService.generateInvoicesForContract(c);
    contracts.push(c);
  }
  return contracts;
}

async function seedPaymentsForPastInvoices() {
  console.log('[seed] paying past invoices…');
  const today = new Date();
  const pastInvoices = await Invoice.find({ dueDate: { $lt: today }, status: { $in: ['PENDING', 'OVERDUE'] } });
  for (let i = 0; i < pastInvoices.length; i++) {
    const inv = pastInvoices[i];
    // 80% are paid, 10% partial, 10% remain overdue
    const dice = Math.random();
    if (dice < 0.8) {
      await rentService.recordPayment({
        invoiceId: inv._id,
        amount: inv.amount,
        method: pick(['BANK_TRANSFER', 'CASH', 'CHEQUE']),
        reference: `MOCK-${100000 + i}`,
        notes: 'Auto-seeded payment',
      });
    } else if (dice < 0.9) {
      await rentService.recordPayment({
        invoiceId: inv._id,
        amount: Math.round(inv.amount * 0.5),
        method: 'BANK_TRANSFER',
        reference: `MOCK-PARTIAL-${i}`,
      });
    }
  }
}

async function seedExpenses(properties) {
  console.log('[seed] expenses…');
  const titles = {
    MAINTENANCE: ['AC repair', 'Plumbing fix', 'Painting', 'Pest control'],
    UTILITY: ['DEWA bill', 'Internet bill', 'Cooling charge'],
    VENDOR: ['Cleaning service', 'Security service', 'Garden maintenance'],
    INSURANCE: ['Annual property insurance'],
    TAX: ['Service charge', 'Municipality fee'],
  };
  const cats = Object.keys(titles);
  const expenses = [];
  for (let i = 0; i < 30; i++) {
    const cat = pick(cats);
    const acc = CATEGORY_ACCOUNT[cat];
    const date = new Date();
    date.setMonth(date.getMonth() - r(0, 8));
    const amt = r(200, 8000);
    const seq = i + 1;
    const exp = await Expense.create({
      number: `EXP-${date.getFullYear()}-${String(seq).padStart(5, '0')}`,
      title: pick(titles[cat]),
      category: cat,
      property: pick(properties)._id,
      vendor: pick(['Al Falah Services', 'Dubai Maintenance LLC', 'Vendor One', 'BlueClean']),
      amount: amt,
      date,
      paidVia: pick(['BANK', 'CASH']),
      accountCode: acc.code,
      accountName: acc.name,
    });
    await accounting.postExpense(exp);
    expenses.push(exp);
  }
  return expenses;
}

async function seedMaintenance(properties, tenants) {
  console.log('[seed] maintenance…');
  for (let i = 0; i < 8; i++) {
    await MaintenanceTicket.create({
      number: `TKT-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      title: pick(['Leaky faucet', 'Broken AC', 'Clogged drain', 'Door handle issue', 'Light fixture']),
      description: 'Tenant reported issue. Needs inspection.',
      property: pick(properties)._id,
      tenant: pick(tenants)._id,
      priority: pick(['LOW', 'MEDIUM', 'HIGH']),
      status: pick(['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED']),
      assigneeName: pick(['Ramesh Kumar', 'Mohamed Ali', 'Jose Cruz']),
      vendor: pick(['Al Falah Services', 'Dubai Maintenance LLC']),
      estimatedCost: r(200, 3000),
    });
  }
}

async function seedLeads(properties, users) {
  console.log('[seed] leads…');
  const stages = ['NEW', 'CONTACTED', 'VIEWING', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];
  const sources = ['WEBSITE', 'WALK_IN', 'REFERRAL', 'PORTAL'];
  const agents = users.filter((u) => u.role === 'AGENT' || u.role === 'MANAGER');
  for (let i = 0; i < 18; i++) {
    await Lead.create({
      name: pick(['Aria Cohen', 'Liam Wright', 'Noah Al Hashimi', 'Olivia Khan', 'Mason Singh', 'Emma Davis', 'Lucas Wang', 'Hannah Brooks']),
      email: `lead${i}@example.com`,
      phone: `+97150${r(1000000, 9999999)}`,
      propertyType: pick(['APARTMENT', 'VILLA', 'OFFICE']),
      targetProperty: pick(properties)._id,
      budgetMin: r(50000, 100000),
      budgetMax: r(120000, 400000),
      source: pick(sources),
      stage: pick(stages),
      agent: pick(agents)._id,
      nextFollowUp: new Date(Date.now() + r(1, 14) * 86400000),
      notes: 'Showed interest after viewing brochure.',
    });
  }
}

async function seedOwnerStatements(properties, owners) {
  console.log('[seed] owner statements (1 month sample)…');
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  for (const p of properties.filter((x) => x.status === 'RENTED').slice(0, 3)) {
    const ownerId = p.owners[0].owner;
    try {
      await accounting.generateOwnerStatement({
        propertyId: p._id,
        ownerId,
        start,
        end,
        periodLabel: `${start.toLocaleString('en-US', { month: 'long' })} ${start.getFullYear()}`,
      });
    } catch (e) {
      console.warn('[seed] statement skip:', e.message);
    }
  }
}

(async () => {
  try {
    await connectDB();
    await ensureSystemAccounts();
    await clearAll();
    await ensureSystemAccounts();
    await ensureFiscalYearFor(new Date());

    const users = await seedUsers();
    const owners = await seedOwners();
    const tenants = await seedTenants();
    const properties = await seedProperties(owners);
    await seedManagementContracts(properties, owners);
    await seedTenanciesAndInvoices(properties, tenants);
    await seedPaymentsForPastInvoices();
    await seedExpenses(properties);
    await seedMaintenance(properties, tenants);
    await seedLeads(properties, users);
    await seedOwnerStatements(properties, owners);

    console.log('[seed] DONE ✅');
    console.log('[seed] login: admin@vantus.com / admin123');
    process.exit(0);
  } catch (e) {
    console.error('[seed] FAILED:', e);
    process.exit(1);
  }
})();
