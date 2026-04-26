import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'AGENT';
  status: 'ENABLED' | 'DISABLED';
  access?: 'FULL_ACCESS' | 'LIMITED_ADMIN' | 'READ_ONLY';
  avatar?: string;
  phone?: string;
}

export const useUsers = (params: any = {}) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: async () => (await api.get('/users', { params })).data as { data: User[]; meta: any },
  });

export const useUserSummary = () =>
  useQuery({
    queryKey: ['user-summary'],
    queryFn: async () => (await api.get('/users/summary')).data.data,
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/users', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user-summary'] });
    },
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: any) => (await api.patch(`/users/${id}`, patch)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user-summary'] });
    },
  });
};

export const useToggleUserStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: any) => (await api.patch(`/users/${id}/status`, { status })).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user-summary'] });
    },
  });
};
