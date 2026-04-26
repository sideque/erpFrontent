# 🌱 Seed Scripts

Modular, idempotent seeders for Vantus ERP. Each seeder can run independently
or be composed into the full demo seed.

## Quick start

```bash
# 1. Wipe DB and seed everything (admins + owners + tenants + properties +
#    contracts + invoices + payments + expenses + maintenance + leads)
npm run seed

# 2. Or seed individual entities (idempotent — safe to re-run)
npm run seed:users
npm run seed:owners
npm run seed:tenants
npm run seed:properties
npm run seed:contracts
npm run seed:payments
npm run seed:expenses
npm run seed:maintenance
npm run seed:leads
```

## Reset a single collection

Add `--reset` after the script:

```bash
node src/seed/cli.js tenants --reset
node src/seed/cli.js expenses --reset
```

## CLI usage

```bash
node src/seed/cli.js list           # show all commands
node src/seed/cli.js users          # upsert demo users
node src/seed/cli.js full           # wipe + seed everything
```

## Folder layout

```
seed/
├── cli.js              # CLI entry point (argv → seeders)
├── seed.js             # Legacy alias for `cli.js full`
├── runner.js           # Shared connect/disconnect + standalone wrapper
├── data/               # Pure data fixtures (no logic)
│   ├── users.data.js
│   ├── owners.data.js
│   ├── tenants.data.js
│   └── properties.data.js
└── seeders/            # Logic that inserts data
    ├── users.seeder.js
    ├── owners.seeder.js
    ├── tenants.seeder.js
    ├── properties.seeder.js
    ├── contracts.seeder.js
    ├── payments.seeder.js
    ├── expenses.seeder.js
    ├── maintenance.seeder.js
    └── leads.seeder.js
```

## How idempotency works

* `users` — matched by `email`; password is **never** overwritten on update.
* `owners` / `tenants` — matched by `email`.
* `properties` — matched by `code`. Owner emails are resolved to ObjectIds.
* `contracts` — matched by `code`. If a contract already exists, it's skipped
  (because invoices and GL entries depend on it). Use `--reset` to start over.
* `expenses` / `maintenance` / `leads` — append-only by default; `--reset`
  wipes the collection first.
* `payments` — only pays invoices that are still PENDING / OVERDUE. Re-running
  is harmless — fully-paid invoices are ignored.

## Adding new demo data

1. Edit (or add) a file under `data/` with the records you want.
2. The corresponding seeder picks them up on the next run.

E.g. to add a new tenant, append to `data/tenants.data.js`, then:
```bash
npm run seed:tenants
```

## Dependency graph

The full seed runs in this order:

```
users → owners → tenants → properties → contracts → payments
                                                  → expenses
                                                  → maintenance
                                                  → leads
```

`contracts` triggers `rentService.generateInvoicesForContract`, which posts
**accrual GL entries** for every invoice. `payments` posts cash receipts that
knock down AR.

## Demo accounts after seeding

| Email | Password | Role |
|-------|----------|------|
| `admin@vantus.com` | `admin123` | Super Admin |
| `manager@vantus.com` | `manager123` | Manager |
| `accountant@vantus.com` | `accountant123` | Accountant |
| `agent@vantus.com` | `agent123` | Agent |
