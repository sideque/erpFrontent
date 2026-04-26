import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Owner {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  avatar?: string;
  bankAccount?: { bankName?: string; iban?: string; accountName?: string };
  verified?: boolean;
  notes?: string;
  properties?: any[];
}

export const useOwners = (params: any = {}) =>
  useQuery({
    queryKey: ['owners', params],
    queryFn: async () => (await api.get('/owners', { params })).data as { data: Owner[]; meta: any },
  });

export const useOwner = (id: string | undefined) =>
  useQuery({
    queryKey: ['owner', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/owners/${id}`)).data.data as Owner,
  });

export const useCreateOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/owners', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  });
};

export const useUpdateOwner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: any) => (await api.patch(`/owners/${id}`, patch)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owners'] }),
  });
};
