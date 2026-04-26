import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@shared/auth/store';
import { Field, Input } from '@shared/ui/Field';

export function LoginPage() {
  const { user, login, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('admin@vantus.com');
  const [password, setPassword] = useState('admin123');

  if (user) return <Navigate to="/dashboard" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back');
      nav('/dashboard');
    } catch {}
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-10">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 grid place-items-center text-white font-extrabold">V</div>
            <div>
              <div className="font-extrabold text-ink-900 tracking-tight">VANTUS</div>
              <div className="text-[11px] text-ink-500">ERP Solution</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-ink-900 tracking-tight">Welcome back</h1>
          <p className="text-ink-500 mt-1.5">Sign in to manage your real-estate portfolio.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </Field>
            <Field label="Password">
              <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-xs text-ink-500">
            <p className="font-semibold text-ink-700 mb-1">Demo accounts</p>
            <ul className="space-y-1">
              <li><code>admin@vantus.com</code> / <code>admin123</code> — Super Admin</li>
              <li><code>manager@vantus.com</code> / <code>manager123</code> — Manager</li>
              <li><code>accountant@vantus.com</code> / <code>accountant123</code> — Accountant</li>
              <li><code>agent@vantus.com</code> / <code>agent123</code> — Agent</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right: hero */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white p-10">
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold tracking-tight">Manage every property, contract & dirham — in one place.</h2>
          <p className="mt-3 text-brand-100">A modern ERP built for real estate firms in Dubai.</p>
          <div className="mt-10 grid grid-cols-1 gap-3">
            {[
              { icon: Building2, label: 'Properties, owners, tenants & contracts' },
              { icon: BarChart3, label: 'Real-time accounting & owner statements' },
              { icon: ShieldCheck, label: 'Role-based access for your whole team' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-white/10 backdrop-blur px-4 py-3 ring-1 ring-white/20">
                <Icon size={18} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
