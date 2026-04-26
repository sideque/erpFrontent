import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (!location.pathname.startsWith('/login')) {
        toast.error('Session expired — please sign in again');
        // Trigger a client-side redirect via the History API so React Router
        // picks it up without a full reload.
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
    const msg = err.response?.data?.error?.message || err.message || 'Request failed';
    if (err.response && err.response.status >= 400 && err.response.status !== 401) {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

export type ApiList<T> = { success: true; data: T[]; meta: { page: number; limit: number; total: number; pages: number } };
export type ApiOne<T> = { success: true; data: T };
