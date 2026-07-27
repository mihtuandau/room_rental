import { apiRequest } from '@/lib/api-client';
import type { RoomStatus } from '@/lib/constants';

export interface AdminDashboardSummary {
  pendingRooms: number;
  pendingReports: number;
  newUsersToday: number;
}

export interface AdminPendingRoom {
  id: number;
  title: string;
  price: number;
  status: RoomStatus;
  city: string;
  district: string;
  createdAt: string;
  owner: { id: string; fullName: string | null; phone: string | null };
}

export interface AdminReport {
  id: string;
  reason: 'fake_listing' | 'wrong_info' | 'scam' | 'already_rented' | 'other';
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  createdAt: string;
  room: { id: number; title: string; slug: string; status: RoomStatus };
  reporter: { id: string; fullName: string | null; phone: string | null };
}

export type AdminUserRole = 'tenant' | 'landlord' | 'admin';

export interface AdminUser {
  id: string;
  phone: string | null;
  fullName: string | null;
  role: AdminUserRole;
  isPhoneVerified: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface AdminUsersParams {
  role?: AdminUserRole;
  keyword?: string;
  status?: 'active' | 'banned';
  page: number;
  pageSize: number;
}

export interface AdminUsersSummary {
  active: number;
  unverified: number;
  banned: number;
}

export interface AdminUsersPage {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  summary: AdminUsersSummary;
}

export interface AdminUsersExport {
  users: AdminUser[];
  total: number;
  truncated: boolean;
}

export function getAdminDashboardSummary() {
  return apiRequest<AdminDashboardSummary>('/admin/dashboard');
}

export function getPendingRooms() {
  return apiRequest<{ rooms: AdminPendingRoom[]; total: number; page: number; pageSize: number }>(
    '/admin/rooms/pending?page=1&pageSize=3',
  );
}

export function getPendingReports() {
  return apiRequest<{ reports: AdminReport[]; total: number; page: number; pageSize: number }>(
    '/admin/reports?status=pending&page=1&pageSize=3',
  );
}

function buildAdminUsersQuery({ role, keyword, status, page, pageSize }: AdminUsersParams) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (role) params.set('role', role);
  if (keyword) params.set('keyword', keyword);
  if (status) params.set('status', status);
  return params.toString();
}

export function getAdminUsers(params: AdminUsersParams) {
  return apiRequest<AdminUsersPage>(`/admin/users?${buildAdminUsersQuery(params)}`);
}

export function exportAdminUsers(params: AdminUsersParams) {
  return apiRequest<AdminUsersExport>(`/admin/users/export?${buildAdminUsersQuery(params)}`);
}

export function banAdminUser(userId: string) {
  return apiRequest<AdminUser>(`/admin/users/${userId}/ban`, { method: 'PATCH' });
}

export function unbanAdminUser(userId: string) {
  return apiRequest<AdminUser>(`/admin/users/${userId}/unban`, { method: 'PATCH' });
}
