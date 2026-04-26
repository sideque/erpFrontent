import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Invoice {
  _id: string;
  number: string;
  contract: any;
  property: any;
  tenant: any;
  type: 'RENT' | 'SECURITY_DEPOSIT' | 'PENALTY' | 'OTHER';
  period?: { label?: string; start?: string; end?: string };
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  balance?: number;
}

export const useInvoices = (params: any = {}) =>
  useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => (await api.get('/rent/invoices', { params })).data as { data: Invoice[]; meta: any },
  });

export const useInvoice = (id?: string) =>
  useQuery({
    queryKey: ['invoice', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/rent/invoices/${id}`)).data.data,
  });

export const useRentDashboard = () =>
  useQuery({
    queryKey: ['rent-dashboard'],
    queryFn: async () => (await api.get('/rent/dashboard')).data.data,
  });

export const usePayments = (params: any = {}) =>
  useQuery({
    queryKey: ['payments', params],
    queryFn: async () => (await api.get('/rent/payments', { params })).data as { data: any[]; meta: any },
  });

export const usePayInvoice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) =>
      (await api.post(`/rent/invoices/${id}/pay`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['invoice'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['rent-dashboard'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['accounting'] });
    },
  });
};
