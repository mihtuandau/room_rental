import { apiRequest } from '@/lib/api-client';

export interface Profile {
  id: string;
  phone: string;
  fullName: string | null;
  avatarUrl: string | null;
  contactPhone: string | null;
  zaloUrl: string | null;
  // Not shown in the UI — there's no role picker or account-type concept here,
  // it only gates /admin (see client/CLAUDE.md section 1).
  role: 'tenant' | 'landlord' | 'admin';
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string;
  contactPhone?: string;
  zaloUrl?: string;
}

export function getProfile() {
  return apiRequest<Profile>('/users/me');
}

export function updateProfile(input: UpdateProfileInput) {
  return apiRequest<Profile>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
