import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export const useDashboard = () =>
  useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/overview')).data.data,
  });

export const useTrialBalance = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'trial-balance', params],
    queryFn: async () => (await api.get('/accounting/trial-balance', { params })).data.data,
  });

export const usePnL = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'pnl', params],
    queryFn: async () => (await api.get('/accounting/pnl', { params })).data.data,
  });

export const useJournal = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'journal', params],
    queryFn: async () => (await api.get('/accounting/journal', { params })).data as { data: any[]; meta: any },
  });

export const useChartOfAccounts = () =>
  useQuery({
    queryKey: ['accounting', 'accounts'],
    queryFn: async () => (await api.get('/accounting/accounts')).data.data as { flat: any[]; tree: any[] },
  });

export const useGeneralLedger = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'general-ledger', params],
    queryFn: async () => (await api.get('/accounting/general-ledger', { params })).data.data,
  });

export const useBalanceSheet = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'balance-sheet', params],
    queryFn: async () => (await api.get('/accounting/balance-sheet', { params })).data.data,
  });

export const useReceivablesAging = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'aging', params],
    queryFn: async () => (await api.get('/accounting/aging', { params })).data.data,
  });

export const useCashFlow = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'cash-flow', params],
    queryFn: async () => (await api.get('/accounting/cash-flow', { params })).data.data,
  });

export const useJournalEntries = (params: any = {}) =>
  useQuery({
    queryKey: ['accounting', 'journal-entries', params],
    queryFn: async () => (await api.get('/accounting/journal-entries', { params })).data.data as any[],
  });

export const useJournalEntry = (id?: string) =>
  useQuery({
    queryKey: ['accounting', 'journal-entry', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/accounting/journal-entries/${id}`)).data.data,
  });

export const useCreateJournalEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/accounting/journal-entries', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounting'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useCancelJournalEntry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await api.post(`/accounting/journal-entries/${id}/cancel`)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounting'] }),
  });
};

export const useOwnerStatements = (params: any = {}) =>
  useQuery({
    queryKey: ['owner-statements', params],
    queryFn: async () => (await api.get('/accounting/owner-statements', { params })).data as { data: any[]; meta: any },
  });

export const useGenerateOwnerStatement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/accounting/owner-statements', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['owner-statements'] }),
  });
};

export const usePayOwnerStatement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: any) => (await api.post(`/accounting/owner-statements/${id}/pay`, payload || {})).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['owner-statements'] });
      qc.invalidateQueries({ queryKey: ['accounting'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
