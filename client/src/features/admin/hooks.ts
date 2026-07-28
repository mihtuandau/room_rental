'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  banAdminUser,
  approveAdminRoom,
  exportAdminUsers,
  getAdminPendingRooms,
  getAdminReports,
  getAdminAmenities,
  getAdminRoomReviewDetail,
  getAdminDashboardSummary,
  getAdminUsers,
  getPendingReports,
  getPendingRooms,
  unbanAdminUser,
  rejectAdminRoom,
  setAdminRoomVerified,
  resolveAdminReport,
  createAdminAmenity,
  updateAdminAmenity,
  deleteAdminAmenity,
  type AdminPendingRoomsParams,
  type AdminReportsParams,
  type AdminUsersParams,
} from './api';

export const adminKeys = {
  all: ['admin'] as const,
  dashboard: () => [...adminKeys.all, 'dashboard'] as const,
  pendingRooms: () => [...adminKeys.all, 'rooms', 'pending'] as const,
  pendingRoomsList: (params: AdminPendingRoomsParams) => [...adminKeys.pendingRooms(), params] as const,
  roomReview: (roomId: number) => [...adminKeys.all, 'rooms', roomId] as const,
  pendingReports: () => [...adminKeys.all, 'reports', 'pending'] as const,
  reports: (params: AdminReportsParams) => [...adminKeys.all, 'reports', params] as const,
  amenities: () => [...adminKeys.all, 'amenities'] as const,
  users: (params: AdminUsersParams) => [...adminKeys.all, 'users', params] as const,
};

export function useAdminDashboardSummary() {
  return useQuery({ queryKey: adminKeys.dashboard(), queryFn: getAdminDashboardSummary });
}

export function usePendingAdminRooms() {
  return useQuery({ queryKey: adminKeys.pendingRooms(), queryFn: getPendingRooms });
}

export function useAdminPendingRooms(params: AdminPendingRoomsParams) {
  return useQuery({ queryKey: adminKeys.pendingRoomsList(params), queryFn: () => getAdminPendingRooms(params), placeholderData: keepPreviousData });
}

export function useAdminRoomReview(roomId: number | null) {
  return useQuery({ queryKey: adminKeys.roomReview(roomId ?? 0), queryFn: () => getAdminRoomReviewDetail(roomId as number), enabled: roomId !== null });
}

function useRoomMutation<T>(mutationFn: (value: T) => Promise<unknown>, success: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: adminKeys.pendingRooms() }); void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() }); toast.success(success); }, onError: () => toast.error('Không thể cập nhật tin. Bạn thử lại nhé.') });
}

export function useApproveAdminRoom() { return useRoomMutation(approveAdminRoom, 'Đã duyệt tin và chuyển sang trạng thái hoạt động.'); }
export function useRejectAdminRoom() { return useRoomMutation(rejectAdminRoom, 'Đã từ chối tin và lưu lý do cho chủ trọ.'); }
export function useSetAdminRoomVerified() { return useRoomMutation(setAdminRoomVerified, 'Đã cập nhật trạng thái xác minh.'); }

export function usePendingAdminReports() {
  return useQuery({ queryKey: adminKeys.pendingReports(), queryFn: getPendingReports });
}

export function useAdminReports(params: AdminReportsParams) {
  return useQuery({ queryKey: adminKeys.reports(params), queryFn: () => getAdminReports(params), placeholderData: keepPreviousData });
}

export function useResolveAdminReport() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: resolveAdminReport, onSuccess: (_, values) => { void queryClient.invalidateQueries({ queryKey: [...adminKeys.all, 'reports'] }); void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() }); toast.success(values.status === 'resolved' ? 'Đã xử lý báo cáo.' : 'Đã bỏ qua báo cáo.'); }, onError: () => toast.error('Không thể xử lý báo cáo. Bạn thử lại nhé.') });
}

export function useAdminAmenities() { return useQuery({ queryKey: adminKeys.amenities(), queryFn: getAdminAmenities }); }
function useAmenityMutation<T>(mutationFn: (value: T) => Promise<unknown>, success: string) { const queryClient = useQueryClient(); return useMutation({ mutationFn, onSuccess: () => { void queryClient.invalidateQueries({ queryKey: adminKeys.amenities() }); toast.success(success); }, onError: () => toast.error('Không thể cập nhật tiện ích. Bạn thử lại nhé.') }); }
export function useCreateAdminAmenity() { return useAmenityMutation(createAdminAmenity, 'Đã thêm tiện ích vào catalogue.'); }
export function useUpdateAdminAmenity() { return useAmenityMutation(updateAdminAmenity, 'Đã cập nhật tiện ích.'); }
export function useDeleteAdminAmenity() { return useAmenityMutation(deleteAdminAmenity, 'Đã xóa tiện ích khỏi catalogue và các tin liên quan.'); }

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
