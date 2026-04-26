import type { Role } from './store';

/**
 * Single source-of-truth permission matrix.
 *
 * Every protectable action in the app maps to a stable string key here.
 * The frontend uses these to: (a) decide which sidebar entries to show,
 * (b) gate route access, and (c) hide create/edit/delete/pay buttons.
 *
 * IMPORTANT: This is a defense-in-depth client check. The backend RBAC
 * (via `requireRole(...)` middleware) is the real authority — denying
 * here only stops bad UX, not bad actors.
 */
export type Permission =
  // Dashboard
  | 'dashboard.view'
  // Properties
  | 'property.view'
  | 'property.create'
  | 'property.edit'
  | 'property.delete'
  // Owners
  | 'owner.view'
  | 'owner.create'
  | 'owner.edit'
  | 'owner.delete'
  // Tenants
  | 'tenant.view'
  | 'tenant.create'
  | 'tenant.edit'
  | 'tenant.delete'
  // Management Contracts
  | 'mgmtContract.view'
  | 'mgmtContract.create'
  // Tenancy Contracts
  | 'tenancyContract.view'
  | 'tenancyContract.create'
  // Rent / Invoices / Payments
  | 'rent.view'
  | 'rent.collect'
  // Expenses
  | 'expense.view'
  | 'expense.create'
  | 'expense.delete'
  // Maintenance
  | 'maintenance.view'
  | 'maintenance.create'
  | 'maintenance.edit'
  // Accounting (P&L, Trial Balance, Journal)
  | 'accounting.view'
  | 'accounting.journal.create'
  | 'accounting.journal.cancel'
  // Owner Statements
  | 'ownerStatement.view'
  | 'ownerStatement.generate'
  | 'ownerStatement.payOut'
  // CRM Leads
  | 'lead.view'
  | 'lead.create'
  | 'lead.edit'
  // User management
  | 'user.view'
  | 'user.create'
  | 'user.edit'
  | 'user.delete';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'dashboard.view',
    'property.view', 'property.create', 'property.edit', 'property.delete',
    'owner.view', 'owner.create', 'owner.edit', 'owner.delete',
    'tenant.view', 'tenant.create', 'tenant.edit', 'tenant.delete',
    'mgmtContract.view', 'mgmtContract.create',
    'tenancyContract.view', 'tenancyContract.create',
    'rent.view', 'rent.collect',
    'expense.view', 'expense.create', 'expense.delete',
    'maintenance.view', 'maintenance.create', 'maintenance.edit',
    'accounting.view', 'accounting.journal.create', 'accounting.journal.cancel',
    'ownerStatement.view', 'ownerStatement.generate', 'ownerStatement.payOut',
    'lead.view', 'lead.create', 'lead.edit',
    'user.view', 'user.create', 'user.edit', 'user.delete',
  ],
  MANAGER: [
    'dashboard.view',
    'property.view', 'property.create', 'property.edit',
    'owner.view', 'owner.create', 'owner.edit',
    'tenant.view', 'tenant.create', 'tenant.edit',
    'mgmtContract.view', 'mgmtContract.create',
    'tenancyContract.view', 'tenancyContract.create',
    'rent.view', 'rent.collect',
    'expense.view', 'expense.create',
    'maintenance.view', 'maintenance.create', 'maintenance.edit',
    'accounting.view',
    'ownerStatement.view', 'ownerStatement.generate', 'ownerStatement.payOut',
    'lead.view', 'lead.create', 'lead.edit',
  ],
  ACCOUNTANT: [
    'dashboard.view',
    'property.view',
    'owner.view',
    'tenant.view',
    'mgmtContract.view',
    'tenancyContract.view',
    'rent.view', 'rent.collect',
    'expense.view', 'expense.create',
    'accounting.view', 'accounting.journal.create', 'accounting.journal.cancel',
    'ownerStatement.view', 'ownerStatement.generate', 'ownerStatement.payOut',
  ],
  AGENT: [
    'dashboard.view',
    'property.view',
    'owner.view',
    'tenant.view', 'tenant.create', 'tenant.edit',
    'tenancyContract.view', 'tenancyContract.create',
    'rent.view',
    'maintenance.view', 'maintenance.create', 'maintenance.edit',
    'lead.view', 'lead.create', 'lead.edit',
  ],
};

export function hasPermission(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(perm) ?? false;
}

export function permissionsFor(role: Role | undefined): ReadonlySet<Permission> {
  if (!role) return new Set();
  return new Set(ROLE_PERMISSIONS[role] || []);
}
