import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  UserCircle2,
  Users,
  FileSignature,
  ScrollText,
  Wallet,
  Receipt,
  Wrench,
  PieChart,
  UserCog,
  ChevronLeft,
  Settings as SettingsIcon,
  LifeBuoy,
} from 'lucide-react';
import { cn } from '@shared/lib/format';
import { useCan } from '@shared/auth/useCan';
import type { Permission } from '@shared/auth/permissions';
import { UserMenu } from './UserMenu';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  perm: Permission;
}

const main: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
  { to: '/properties', label: 'Properties', icon: Building2, perm: 'property.view' },
  { to: '/owners', label: 'Owners', icon: UserCircle2, perm: 'owner.view' },
  { to: '/tenants', label: 'Tenants', icon: Users, perm: 'tenant.view' },
  { to: '/management-contracts', label: 'Mgmt. Contracts', icon: FileSignature, perm: 'mgmtContract.view' },
  { to: '/tenancy-contracts', label: 'Tenancy Contracts', icon: ScrollText, perm: 'tenancyContract.view' },
  { to: '/rent', label: 'Rent & Invoices', icon: Wallet, perm: 'rent.view' },
  { to: '/expenses', label: 'Expenses', icon: Receipt, perm: 'expense.view' },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, perm: 'maintenance.view' },
  { to: '/accounting', label: 'Accounting', icon: PieChart, perm: 'accounting.view' },
  { to: '/leads', label: 'CRM Leads', icon: UserCog, perm: 'lead.view' },
];

function NavItemRow({ item }: { item: NavItem }) {
  const ok = useCan(item.perm);
  if (!ok) return null;
  return (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition',
          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-slate-100 hover:text-ink-900'
        )
      }
    >
      <item.icon size={18} />
      {item.label}
    </NavLink>
  );
}

export function Sidebar() {
  const canManageUsers = useCan('user.view');
  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-line bg-white">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-line">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 grid place-items-center text-white font-extrabold shadow-sm">
          V
        </div>
        <div className="flex-1">
          <div className="font-extrabold text-ink-900 leading-none tracking-tight">VANTUS</div>
          <div className="text-[11px] text-ink-500">ERP Solution</div>
        </div>
        <button className="text-ink-400 hover:text-ink-700">
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <p className="px-2.5 mb-2 text-[10px] font-bold tracking-widest text-ink-400 uppercase">Main</p>
        <nav className="space-y-0.5">
          {main.map((item) => <NavItemRow key={item.to} item={item} />)}
        </nav>

        <p className="px-2.5 mt-6 mb-2 text-[10px] font-bold tracking-widest text-ink-400 uppercase">Others</p>
        <nav className="space-y-0.5">
          {canManageUsers && (
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-slate-100'
                )
              }
            >
              <SettingsIcon size={18} /> Settings
            </NavLink>
          )}
          <button className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-700 hover:bg-slate-100">
            <LifeBuoy size={18} /> Support
          </button>
        </nav>
      </div>

      <div className="px-3 pb-4">
        <UserMenu />
      </div>
    </aside>
  );
}
