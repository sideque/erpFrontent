import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronUp, LogOut, Settings as SettingsIcon, UserCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@shared/ui/Avatar';
import { useAuth } from '@shared/auth/store';
import { cn } from '@shared/lib/format';
import { Modal } from '@shared/ui/Modal';

export function UserMenu() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  const doLogout = async () => {
    setConfirm(false);
    setOpen(false);
    qc.clear();
    logout();
    toast.success('Signed out');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center gap-2.5 rounded-xl border p-2.5 transition',
          open ? 'border-brand-200 bg-brand-50/40' : 'border-line hover:bg-slate-50'
        )}
      >
        <Avatar src={user?.avatar} name={user?.name} size={36} />
        <div className="min-w-0 flex-1 text-left">
          <div className="text-sm font-semibold text-ink-900 truncate">{user?.name || 'User'}</div>
          <div className="text-[11px] text-ink-500 truncate">{user?.email}</div>
        </div>
        <ChevronUp size={16} className={cn('text-ink-400 transition-transform', !open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl border border-line shadow-pop overflow-hidden z-30">
          <div className="px-3 py-3 border-b border-line">
            <div className="text-[11px] uppercase tracking-wider text-ink-400 font-semibold">Signed in as</div>
            <div className="mt-0.5 text-sm font-semibold text-ink-900 truncate">{user?.email}</div>
            <div className="mt-0.5 text-[11px] text-brand-700 font-semibold">{user?.role.replace(/_/g, ' ')}</div>
          </div>
          <div className="py-1">
            <MenuItem icon={<UserCircle2 size={16} />} label="My profile" onClick={() => { setOpen(false); nav('/settings'); }} />
            <MenuItem icon={<SettingsIcon size={16} />} label="Settings" onClick={() => { setOpen(false); nav('/settings'); }} />
          </div>
          <div className="py-1 border-t border-line">
            <MenuItem
              icon={<LogOut size={16} />}
              label="Sign out"
              destructive
              onClick={() => { setOpen(false); setConfirm(true); }}
            />
          </div>
        </div>
      )}

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Sign out of Vantus ERP?"
        subtitle="You'll need to sign in again to access the workspace."
        width="max-w-sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(false)}>Cancel</button>
            <button className="btn-danger" onClick={doLogout}><LogOut size={16} /> Sign out</button>
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
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition',
        destructive ? 'text-rose-600 hover:bg-rose-50' : 'text-ink-700 hover:bg-slate-50'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
