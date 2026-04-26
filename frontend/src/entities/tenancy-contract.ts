import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface TenancyContract {
  _id: string;
  code: string;
  property: any;
  tenant: any;
  annualRent: number;
  paymentSchedule: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  securityDeposit: number;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'RENEWED';
  rules?: string;
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
