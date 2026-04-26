import { create } from 'zustand';
import { api } from '../api/client';

export type Role = 'SUPER_ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'AGENT';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  access?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  hydrated: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, token } = data.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      set({ user, token, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null });
    // Use a soft redirect so React Router transitions cleanly. Fallback to hard
    // replace if we're not on the login page yet (e.g. when called from the
    // 401 interceptor in shared/api/client).
    if (window.location.pathname !== '/login') {
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  },

  hydrate: async () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (!token || !userStr) {
      set({ hydrated: true });
      return;
    }
    try {
      const user = JSON.parse(userStr);
      set({ user, token, hydrated: true });
      const { data } = await api.get('/auth/me');
      set({ user: data.data });
      localStorage.setItem('auth_user', JSON.stringify(data.data));
    } catch {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      set({ user: null, token: null, hydrated: true });
    }
  },
}));

export const can = (role: Role | undefined, ...allowed: Role[]) => !!role && allowed.includes(role);
