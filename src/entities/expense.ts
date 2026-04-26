import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Expense {
  _id: string;
  number: string;
  title: string;
  category: 'MAINTENANCE' | 'UTILITY' | 'VENDOR' | 'INSURANCE' | 'TAX' | 'OTHER';
  property?: any;
  vendor?: string;
  amount: number;
  date: string;
  paidVia?: 'CASH' | 'BANK';
  notes?: string;
}

export const useExpenses = (params: any = {}) =>
  useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => (await api.get('/expenses', { params })).data as { data: Expense[]; meta: any },
  });

export const useExpenseSummary = () =>
  useQuery({
    queryKey: ['expense-summary'],
    queryFn: async () => (await api.get('/expenses/summary')).data.data,
  });

export const useCreateExpense = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/expenses', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expense-summary'] });
      qc.invalidateQueries({ queryKey: ['accounting'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
