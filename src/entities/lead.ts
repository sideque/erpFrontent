import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  propertyType?: string;
  budgetMin?: number;
  budgetMax?: number;
  source?: string;
  stage: 'NEW' | 'CONTACTED' | 'VIEWING' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  agent?: any;
  nextFollowUp?: string;
  notes?: string;
}

export const useLeadPipeline = () =>
  useQuery({
    queryKey: ['leads', 'pipeline'],
    queryFn: async () => (await api.get('/crm/pipeline')).data.data as Record<string, Lead[]>,
  });

export const useCreateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/crm', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
};

export const useUpdateLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: any) => (await api.patch(`/crm/${id}`, patch)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
};
