'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  banAdminUser,
  exportAdminUsers,
  getAdminDashboardSummary,
  getAdminUsers,
  getPendingReports,
  getPendingRooms,
  unbanAdminUser,
  type AdminUsersParams,
} from './api';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  pendingRooms: () => [...adminKeys.all, 'rooms', 'pending'] as const,
  pendingReports: () => [...adminKeys.all, 'reports', 'pending'] as const,
  users: (params: AdminUsersParams) => [...adminKeys.all, 'users', params] as const,
};

export function useAdminDashboardSummary() {
  return useQuery({ queryKey: adminKeys.dashboard(), queryFn: getAdminDashboardSummary });
}

export function usePendingAdminRooms() {
  return useQuery({ queryKey: adminKeys.pendingRooms(), queryFn: getPendingRooms });
}

export function usePendingAdminReports() {
  return useQuery({ queryKey: adminKeys.pendingReports(), queryFn: getPendingReports });
}

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => getAdminUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useBanAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: banAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
      toast.success('Đã khóa tài khoản và thu hồi các phiên đăng nhập.');
    },
    onError: () => toast.error('Không thể khóa tài khoản. Bạn thử lại nhé.'),
  });
}

export function useUnbanAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unbanAdminUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'users'] });
      toast.success('Đã mở khóa tài khoản.');
    },
    onError: () => toast.error('Không thể mở khóa tài khoản. Bạn thử lại nhé.'),
  });
}

export function useExportAdminUsers() {
  return useMutation({ mutationFn: exportAdminUsers });
}
