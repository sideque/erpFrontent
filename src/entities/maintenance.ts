import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Ticket {
  _id: string;
  number: string;
  title: string;
  description?: string;
  property: any;
  tenant?: any;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigneeName?: string;
  vendor?: string;
  estimatedCost?: number;
  actualCost?: number;
  reportedAt?: string;
}

export const useTickets = (params: any = {}) =>
  useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => (await api.get('/maintenance', { params })).data as { data: Ticket[]; meta: any },
  });

export const useCreateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/maintenance', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
};

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: any) => (await api.patch(`/maintenance/${id}`, patch)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
};
