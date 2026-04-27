import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/api/client';

export interface ManagementContract {
  _id: string;
  propertyId: any;
  ownerId: any;
  contractStartDate: string;
  contractEndDate: string;
  autoRenew: boolean;
  contractStatus: 'Active' | 'Expired' | 'Terminated' | 'Pending';
  
  commissionType: 'Percentage' | 'Fixed';
  commissionValue: number;
  ownerSharePercentage: number;
  companySharePercentage: number;
  paymentCycle: 'Monthly' | 'Quarterly' | 'Yearly';
  
  expenseResponsibility: 'Owner' | 'Company' | 'Shared';
  expenseApprovalRequired: boolean;
  expenseLimit?: number;
  
  canCollectRent: boolean;
  canManageTenants: boolean;
  canHandleMaintenance: boolean;
  canListProperty: boolean;
  
  contractFileUrl?: string;
  additionalDocuments?: string[];
  
  createdAt: string;
  updatedAt: string;
}

export const useManagementContracts = (params: any = {}) =>
  useQuery({
    queryKey: ['management-contracts', params],
    queryFn: async () => (await api.get('/management-contracts', { params })).data as { data: ManagementContract[]; meta: any },
  });

export const useManagementContract = (id: string | undefined) =>
  useQuery({
    queryKey: ['management-contract', id],
    enabled: !!id,
    queryFn: async () => (await api.get(`/management-contracts/${id}`)).data.data as ManagementContract,
  });

export const useCreateManagementContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => (await api.post('/management-contracts', payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['management-contracts'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

export const useUpdateManagementContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => 
      (await api.put(`/management-contracts/${id}`, payload)).data.data,
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['management-contracts'] });
      qc.invalidateQueries({ queryKey: ['management-contract', data._id] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

export const useUpdateManagementContractStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => 
      (await api.patch(`/management-contracts/${id}/status`, { status })).data.data,
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['management-contracts'] });
      qc.invalidateQueries({ queryKey: ['management-contract', data._id] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};

export const useRenewManagementContract = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => 
      (await api.post(`/management-contracts/${id}/renew`, payload)).data.data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['management-contracts'] });
      qc.invalidateQueries({ queryKey: ['properties'] });
    },
  });
};
