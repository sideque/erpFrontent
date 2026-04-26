import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Tenant {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  occupation?: string;
  employer?: string;
  idType?: string;
  idNumber?: string;
  avatar?: string;
  blacklisted?: boolean;
  riskTag?: 'LOW' | 'MEDIUM' | 'HIGH';
  notes?: string;
}

export const useTenants = (params: any = {}) =>
  useQuery({
    queryKey: ['tenants', params],
    queryFn: async () => (await api.get('/tenants', { params })).data as { data: Tenant[]; meta: any },
  });

export const useTenant = (id?: string) =>
  useQuery({
    queryKey: ['tenant', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/tenants/${id}`)).data.data as Tenant,
  });

export const useCreateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/tenants', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};

export const useUpdateTenant = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: any) => (await api.patch(`/tenants/${id}`, patch)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenants'] }),
  });
};
