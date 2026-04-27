import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface Property {
  _id: string;
  code: string;
  name: string;
  type: 'APARTMENT' | 'VILLA' | 'OFFICE' | 'LAND';
  status: 'AVAILABLE' | 'RENTED' | 'UNDER_MAINTENANCE' | 'MANAGED';
  location?: { area?: string; community?: string; address?: string; city?: string };
  sizeSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  units?: number;
  rentEstimate?: number;
  description?: string;
  images?: string[];
  owners?: { owner: any; percentage: number }[];
  createdAt?: string;
}

export const useProperties = (params: any = {}) =>
  useQuery({
    queryKey: ['properties', params],
    queryFn: async () => {
      const { data } = await api.get('/properties', { params });
      return data as { data: Property[]; meta: any };
    },
  });

export const useProperty = (id: string | undefined) =>
  useQuery({
    queryKey: ['property', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/properties/${id}`)).data.data as Property,
  });

export const usePropertySummary = () =>
  useQuery({
    queryKey: ['property-summary'],
    queryFn: async () => (await api.get('/properties/summary')).data.data as { total: number; status: any; types: any; occupancy: number },
  });

export const useCreateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/properties', payload)).data.data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
};

export const useUpdateProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => (await api.patch(`/properties/${id}`, patch)).data.data,
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['properties'] });
      qc.invalidateQueries({ queryKey: ['property', v.id] });
    },
  });
};

export const useDeleteProperty = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['properties'] }),
  });
};
