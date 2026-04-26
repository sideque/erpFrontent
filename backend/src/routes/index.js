const router = require('express').Router();

router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/user.routes'));
router.use('/properties', require('../modules/properties/property.routes'));
router.use('/owners', require('../modules/owners/owner.routes'));
router.use('/tenants', require('../modules/tenants/tenant.routes'));
router.use('/management-contracts', require('../modules/management-contracts/managementContract.routes'));
router.use('/tenancy-contracts', require('../modules/tenancy-contracts/tenancyContract.routes'));
router.use('/rent', require('../modules/rent/rent.routes'));
router.use('/expenses', require('../modules/expenses/expense.routes'));
router.use('/maintenance', require('../modules/maintenance/maintenance.routes'));
router.use('/accounting', require('../modules/accounting/accounting.routes'));
router.use('/crm', require('../modules/crm/crm.routes'));
router.use('/dashboard', require('../modules/dashboard/dashboard.routes'));

router.get('/', (_req, res) => res.json({ success: true, data: { name: 'Vantus ERP API', version: '1.0.0' } }));

module.exports = router;
