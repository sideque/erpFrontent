import { FormEvent, useMemo, useState } from 'react';
import { Plus, Search, Settings as SettingsIcon, MoreHorizontal, UserPlus, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useUsers, useUserSummary, useCreateUser, useToggleUserStatus } from '@entities/index';
import { PageHeader } from '@shared/ui/PageHeader';
import { Card, CardHeader } from '@shared/ui/Card';
import { Modal } from '@shared/ui/Modal';
import { Field, Input, Select } from '@shared/ui/Field';
import { Avatar } from '@shared/ui/Avatar';
import { Badge, StatusBadge } from '@shared/ui/Badge';
import { Table, Column } from '@shared/ui/Table';
import { useAuth } from '@shared/auth/store';
import { Can, useCan } from '@shared/auth/useCan';

const ROLES = [
  { key: 'SUPER_ADMIN', label: 'Super Admin' },
  { key: 'MANAGER', label: 'Manager' },
  { key: 'ACCOUNTANT', label: 'Accountant' },
  { key: 'AGENT', label: 'Agent' },
];

export function SettingsPage() {
  const [tab, setTab] = useState<'ALL' | 'SUPER_ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'AGENT'>('ALL');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const { user, logout } = useAuth();
  const canEditUsers = useCan('user.edit');
  const qc = useQueryClient();
  const params = useMemo(() => ({ q, role: tab === 'ALL' ? '' : tab, limit: 50 }), [q, tab]);
  const { data } = useUsers(params);
  const { data: summary } = useUserSummary();
  const create = useCreateUser();
  const toggle = useToggleUserStatus();
  const [form, setForm] = useState<any>({ name: '', email: '', password: '', role: 'AGENT', access: 'LIMITED_ADMIN' });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await create.mutateAsync(form);
      toast.success('User created');
      setOpen(false);
      setForm({ name: '', email: '', password: '', role: 'AGENT', access: 'LIMITED_ADMIN' });
    } catch {}
  };

  const cols: Column<any>[] = [
    { key: 'name', header: 'Account', render: (u) => (
      <div className="flex items-center gap-3"><Avatar src={u.avatar} name={u.name} />
        <div><div className="font-semibold">{u.name}</div></div></div>
    ) },
    { key: 'email', header: 'Email Address', render: (u) => <span>{u.email}</span> },
    { key: 'role', header: 'Role', render: (u) => <Badge tone="blue">{u.role.replaceAll('_', ' ')}</Badge> },
    { key: 'access', header: 'Access', render: (u) => <Badge tone="gray">{u.access?.replaceAll('_', ' ')}</Badge> },
    { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
    { key: 'act', header: '', render: (u) => canEditUsers && (
      <button className="text-ink-400 hover:text-ink-900" onClick={(e) => { e.stopPropagation(); toggle.mutate({ id: u._id, status: u.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' }); }}>
        <MoreHorizontal size={18} />
      </button>
    ) },
  ];

  return (
    <>
      <PageHeader
        title="Administrators"
        breadcrumbs={[{ label: 'Settings' }, { label: 'Admin Panel' }, { label: 'Administrators' }]}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setSignOutOpen(true)}><LogOut size={16} /> Sign out</button>
            <Can perm="user.create">
              <button className="btn-primary" onClick={() => setOpen(true)}><UserPlus size={16} /> Add Member</button>
            </Can>
          </>
        }
      />

      <Card className="mb-6">
        <CardHeader
          title="Administrators"
          icon={<SettingsIcon size={18} />}
          subtitle="Access is based on role: Super Admin, Manager, or Accountant. Each role unlocks specific menus and features."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.slice(0, 3).map((role) => (
            <RoleColumn key={role.key} title={role.label} role={role.key} />
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Administrator Accounts"
          subtitle={summary ? `${summary.total} accounts · ${summary.enabled} enabled · ${summary.disabled} disabled` : ''}
          action={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input className="input pl-8 w-56" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
          }
        />

        <div className="border-b border-line mb-4">
          <nav className="flex gap-6 -mb-px">
            <Tab active={tab === 'ALL'} onClick={() => setTab('ALL')} label={`All (${summary?.total ?? 0})`} />
            <Tab active={tab === 'SUPER_ADMIN'} onClick={() => setTab('SUPER_ADMIN')} label={`Super Admin (${summary?.roles?.SUPER_ADMIN ?? 0})`} />
            <Tab active={tab === 'MANAGER'} onClick={() => setTab('MANAGER')} label={`Manager (${summary?.roles?.MANAGER ?? 0})`} />
            <Tab active={tab === 'ACCOUNTANT'} onClick={() => setTab('ACCOUNTANT')} label={`Accountant (${summary?.roles?.ACCOUNTANT ?? 0})`} />
            <Tab active={tab === 'AGENT'} onClick={() => setTab('AGENT')} label={`Agent (${summary?.roles?.AGENT ?? 0})`} />
          </nav>
        </div>

        <Table columns={cols} rows={data?.data || []} />
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Add team member" width="max-w-md" footer={
        <>
          <button className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button form="user-form" className="btn-primary">Create</button>
        </>
      }>
        <form id="user-form" onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Field label="Full Name" required><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field></div>
          <div className="col-span-2"><Field label="Email" required><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field></div>
          <div className="col-span-2"><Field label="Password" required hint="At least 6 characters"><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field></div>
          <Field label="Role"><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </Select></Field>
          <Field label="Access"><Select value={form.access} onChange={(e) => setForm({ ...form, access: e.target.value })}>
            <option value="FULL_ACCESS">Full Access</option><option value="LIMITED_ADMIN">Limited Admin</option><option value="READ_ONLY">Read Only</option>
          </Select></Field>
        </form>
      </Modal>

      <Modal
        open={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        title="Sign out of Vantus ERP?"
        subtitle="You'll need to sign in again to access the workspace."
        width="max-w-sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setSignOutOpen(false)}>Cancel</button>
            <button
              className="btn-danger"
              onClick={() => {
                setSignOutOpen(false);
                qc.clear();
                logout();
                toast.success('Signed out');
              }}
            >
              <LogOut size={16} /> Sign out
            </button>
          </>
        }
      >
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name} size={48} />
          <div className="min-w-0">
            <div className="font-semibold text-ink-900 truncate">{user?.name}</div>
            <div className="text-sm text-ink-500 truncate">{user?.email}</div>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`pb-3 text-sm font-semibold border-b-2 ${active ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-800'}`}>
      {label}
    </button>
  );
}

function RoleColumn({ title, role }: { title: string; role: string }) {
  const { data } = useUsers({ role, limit: 3 });
  const toggle = useToggleUserStatus();
  const canEdit = useCan('user.edit');
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-ink-900">{title}</h3>
        <button className="text-xs text-ink-500 font-semibold hover:text-ink-900">See All</button>
      </div>
      <ul className="space-y-3">
        {(data?.data || []).map((u: any) => (
          <li key={u._id} className="flex items-center gap-3">
            <Avatar src={u.avatar} name={u.name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{u.name}</div>
              <div className="text-xs text-ink-500 truncate">{u.email}</div>
            </div>
            <button
              disabled={!canEdit}
              className={canEdit ? '' : 'cursor-default'}
              onClick={() => canEdit && toggle.mutate({ id: u._id, status: u.status === 'ENABLED' ? 'DISABLED' : 'ENABLED' })}
            >
              <StatusBadge status={u.status} />
            </button>
          </li>
        ))}
        {(data?.data || []).length === 0 && <p className="text-xs text-ink-400 text-center py-2">No users in this role.</p>}
      </ul>
      <button className="mt-4 w-full rounded-lg border border-line bg-slate-50 hover:bg-slate-100 py-2 text-sm font-semibold text-ink-700 inline-flex items-center justify-center gap-2">
        <SettingsIcon size={14} /> Manage
      </button>
    </div>
  );
}
