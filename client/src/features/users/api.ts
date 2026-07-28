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
  role: 'user' | 'admin';
  isPhoneVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string;
  /** `null` explicitly removes an existing contact detail. */
  contactPhone?: string | null;
  /** `null` explicitly removes an existing contact detail. */
  zaloUrl?: string | null;
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
