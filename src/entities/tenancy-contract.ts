import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface TenancyContract {
  _id: string;
  code: string;
  property: any;
  tenant: any;
  annualRent: number;
  paymentSchedule: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  rentDueDate?: number;
  securityDeposit: number;
  lateFee?: number;
  gracePeriodDays?: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED' | 'CANCELLED';
  contractFile?: string;
  rules?: string;
  notes?: string;
  invoicesGenerated?: boolean;
}

export const useTenancyContracts = (params: any = {}) =>
  useQuery({
    queryKey: ['tenancy-contracts', params],
    queryFn: async () => (await api.get('/tenancy-contracts', { params })).data as { data: TenancyContract[]; meta: any },
  });

export const useCreateTenancyContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/tenancy-contracts', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenancy-contracts'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['rent-dashboard'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useTenancyContract = (id: string | undefined) =>
  useQuery({
    queryKey: ['tenancy-contract', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/tenancy-contracts/${id}`)).data.data as TenancyContract,
  });

export const useUpdateTenancyContractStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => (await api.patch(`/tenancy-contracts/${id}/status`, { status })).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenancy-contracts'] });
      qc.invalidateQueries({ queryKey: ['tenancy-contract'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useRenewTenancyContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => (await api.post(`/tenancy-contracts/${id}/renew`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenancy-contracts'] });
      qc.invalidateQueries({ queryKey: ['tenancy-contract'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['rent-dashboard'] });
    },
  });
};

export const useDeleteTenancyContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/tenancy-contracts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenancy-contracts'] }),
  });
};
