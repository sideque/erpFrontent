import { Link } from 'react-router-dom';
import {
  Building2,
  Wallet,
  Receipt,
  TrendingUp,
  Users,
  AlertTriangle,
  Wrench,
  FileSignature,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useDashboard } from '@entities/index';
import { useInvoices } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { KpiCard } from '@widgets/KpiCard';
import { PageLoader } from '@shared/ui/Spinner';
import { formatAed, formatDate } from '@shared/lib/format';
import { StatusBadge } from '@shared/ui/Badge';

export function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const { data: overdue } = useInvoices({ status: 'OVERDUE', limit: 5 });

  if (isLoading || !data) return <PageLoader />;
  const { kpis, months } = data;

  const occupancyData = [
    { name: 'Rented', value: kpis.rentedProperties, color: '#3b6dff' },
    { name: 'Available', value: kpis.availableProperties, color: '#10b981' },
    { name: 'Maintenance', value: kpis.underMaintenance, color: '#f59e0b' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Income (lifetime)"
          value={formatAed(kpis.totalIncome)}
          hint={`${kpis.activeContracts} active contracts`}
          icon={<Wallet size={20} />}
          tone="brand"
        />
        <KpiCard
          label="Total Expense"
          value={formatAed(kpis.totalExpense)}
          hint={`Open tickets: ${kpis.openTickets}`}
          icon={<Receipt size={20} />}
          tone="rose"
        />
        <KpiCard
          label="Net Profit"
          value={formatAed(kpis.netProfit)}
          hint="Income − Expense"
          icon={<TrendingUp size={20} />}
          tone="green"
        />
        <KpiCard
          label="Occupancy"
          value={`${kpis.occupancy}%`}
          hint={`${kpis.rentedProperties} of ${kpis.totalProperties} rented`}
          icon={<Building2 size={20} />}
          tone="amber"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        <KpiCard label="This month — collected" value={formatAed(kpis.paidThisMonth)} icon={<Wallet size={18} />} tone="green" />
        <KpiCard label="This month — expenses" value={formatAed(kpis.expensesThisMonth)} icon={<Receipt size={18} />} tone="rose" />
        <KpiCard label="Overdue invoices" value={kpis.overdueInvoices} icon={<AlertTriangle size={18} />} tone="amber" />
        <KpiCard label="Expiring contracts (60d)" value={kpis.expiringContracts} icon={<FileSignature size={18} />} tone="brand" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Income vs Expense"
            subtitle="Last 12 months"
            icon={<TrendingUp size={18} />}
          />
          <div className="h-72 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={months} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="g-income" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b6dff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b6dff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g-expense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: any) => formatAed(Number(v))}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb' }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" name="Income" dataKey="income" stroke="#3b6dff" fill="url(#g-income)" strokeWidth={2.5} />
                <Area type="monotone" name="Expense" dataKey="expense" stroke="#f43f5e" fill="url(#g-expense)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Property occupancy" icon={<Building2 size={18} />} />
          <div className="h-56 grid place-items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {occupancyData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            {occupancyData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold text-ink-900">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Overdue rent invoices"
            icon={<AlertTriangle size={18} />}
            action={<Link to="/rent" className="text-sm font-semibold text-brand-700">View all →</Link>}
          />
          {overdue?.data?.length ? (
            <ul className="divide-y divide-line">
              {overdue.data.map((inv: any) => (
                <li key={inv._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-ink-900">{inv.number} · {inv.tenant?.name}</div>
                    <div className="text-xs text-ink-500">{inv.property?.name} · due {formatDate(inv.dueDate)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-rose-600">{formatAed(inv.amount - inv.paidAmount)}</div>
                    <StatusBadge status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-500 py-6 text-center">No overdue invoices 🎉</p>}
        </Card>

        <Card>
          <CardHeader title="Quick stats" icon={<Users size={18} />} />
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between"><span className="text-ink-600">Tenants</span><span className="font-semibold">{kpis.tenantCount}</span></li>
            <li className="flex items-center justify-between"><span className="text-ink-600">Owners</span><span className="font-semibold">{kpis.ownerCount}</span></li>
            <li className="flex items-center justify-between"><span className="text-ink-600">Active contracts</span><span className="font-semibold">{kpis.activeContracts}</span></li>
            <li className="flex items-center justify-between"><span className="text-ink-600">Open tickets</span><span className="font-semibold">{kpis.openTickets}</span></li>
            <li className="flex items-center justify-between"><span className="text-ink-600">Properties</span><span className="font-semibold">{kpis.totalProperties}</span></li>
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <Link to="/maintenance" className="btn-secondary flex-1"><Wrench size={14} /> Maintenance</Link>
            <Link to="/leads" className="btn-primary flex-1">CRM Pipeline</Link>
          </div>
        </Card>
      </div>
    </>
  );
}
