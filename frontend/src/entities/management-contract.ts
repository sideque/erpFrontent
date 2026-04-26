import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface ManagementContract {
  _id: string;
  code: string;
  property: any;
  owners: any[];
  commissionPct: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  expensesBornBy?: string;
  incomeRule?: string;
}

export const useManagementContracts = (params: any = {}) =>
  useQuery({
    queryKey: ['management-contracts', params],
    queryFn: async () => (await api.get('/management-contracts', { params })).data as { data: ManagementContract[]; meta: any },
  });

export const useCreateManagementContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/management-contracts', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['management-contracts'] }),
  });
};
