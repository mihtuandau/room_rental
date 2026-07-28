import { apiRequest } from '@/lib/api-client';
import type { AmenityType, RoomStatus } from '@/lib/constants';
import type { Amenity } from '@/features/amenities/api';

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
  roomType: 'boarding_house' | 'whole_house' | 'mini_apartment' | 'serviced_apartment' | 'shared_room';
  isVerified: boolean;
  images: { url: string }[];
  createdAt: string;
  owner: { id: string; fullName: string | null; phone: string | null };
}

export interface AdminPendingRoomsParams {
  keyword?: string;
  verified?: string;
  page: number;
  pageSize: number;
}

export interface AdminPendingRoomsPage {
  rooms: AdminPendingRoom[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminRoomReviewDetail extends AdminPendingRoom {
  description: string | null;
  ward: string | null;
  address: string | null;
  area: number | null;
  amenities: { id: number; name: string; slug: string; icon: string | null }[];
  owner: AdminPendingRoom['owner'] & { email: string | null; contactPhone: string | null; isPhoneVerified: boolean; createdAt: string };
  moderations: { id: string; action: string; note: string | null; createdAt: string; admin: { id: string; fullName: string | null } }[];
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

export type AdminReportStatus = AdminReport['status'];
export interface AdminReportsParams { status?: AdminReportStatus; page: number; pageSize: number; }
export interface AdminReportsPage { reports: AdminReport[]; total: number; page: number; pageSize: number; }

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

function buildPendingRoomsQuery({ keyword, verified, page, pageSize }: AdminPendingRoomsParams) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (keyword) params.set('keyword', keyword);
  if (verified) params.set('verified', verified);
  return params.toString();
}

export function getAdminPendingRooms(params: AdminPendingRoomsParams) {
  return apiRequest<AdminPendingRoomsPage>(`/admin/rooms/pending?${buildPendingRoomsQuery(params)}`);
}

export function getAdminRoomReviewDetail(roomId: number) {
  return apiRequest<AdminRoomReviewDetail>(`/admin/rooms/${roomId}`);
}

export function approveAdminRoom(roomId: number) {
  return apiRequest<AdminPendingRoom>(`/admin/rooms/${roomId}/approve`, { method: 'PATCH' });
}

export function rejectAdminRoom({ roomId, note }: { roomId: number; note: string }) {
  return apiRequest<AdminPendingRoom>(`/admin/rooms/${roomId}/reject`, { method: 'PATCH', body: JSON.stringify({ note }) });
}

export function setAdminRoomVerified({ roomId, isVerified }: { roomId: number; isVerified: boolean }) {
  return apiRequest<AdminPendingRoom>(`/admin/rooms/${roomId}/verified`, { method: 'PATCH', body: JSON.stringify({ isVerified }) });
}

export function getPendingReports() {
  return apiRequest<{ reports: AdminReport[]; total: number; page: number; pageSize: number }>(
    '/admin/reports?status=pending&page=1&pageSize=3',
  );
}

export function getAdminReports({ status, page, pageSize }: AdminReportsParams) {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set('status', status);
  return apiRequest<AdminReportsPage>(`/admin/reports?${params}`);
}

export function resolveAdminReport({ id, status, resolutionNote }: { id: string; status: 'resolved' | 'dismissed'; resolutionNote: string }) {
  return apiRequest<AdminReport>(`/admin/reports/${id}/resolve`, { method: 'PATCH', body: JSON.stringify({ status, resolutionNote }) });
}

export function getAdminAmenities() { return apiRequest<Amenity[]>('/amenities'); }
export function createAdminAmenity(body: { name: string; type: AmenityType; icon?: string }) { return apiRequest<Amenity>('/admin/amenities', { method: 'POST', body: JSON.stringify(body) }); }
export function updateAdminAmenity({ id, ...body }: { id: number; name?: string; type?: AmenityType; icon?: string }) { return apiRequest<Amenity>(`/admin/amenities/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); }
export function deleteAdminAmenity(id: number) { return apiRequest<{ success: boolean }>(`/admin/amenities/${id}`, { method: 'DELETE' }); }

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
