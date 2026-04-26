import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '@shared/auth/store';

export function ForbiddenPage() {
  const role = useAuth((s) => s.user?.role);
  return (
    <div className="grid place-items-center py-20">
      <div className="card max-w-md text-center !p-8">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 grid place-items-center text-rose-600">
          <ShieldAlert size={28} />
        </div>
        <h1 className="mt-4 text-xl font-bold text-ink-900">Access denied</h1>
        <p className="mt-2 text-sm text-ink-600">
          Your role <span className="font-semibold text-ink-900">{role?.replaceAll('_', ' ') || '—'}</span> doesn't have permission
          to view this section. Please contact a Super Admin if you need access.
        </p>
        <Link to="/dashboard" className="btn-primary mt-6 mx-auto">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
