const app = require('./app');
const { connectDB } = require('./config/db');
const env = require('./config/env');
const { ensureSystemAccounts } = require('./modules/accounting/account.model');

(async () => {
  await connectDB();
  await ensureSystemAccounts();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
    console.log(`[server] api root  http://localhost:${env.PORT}/api`);
  });
})();
