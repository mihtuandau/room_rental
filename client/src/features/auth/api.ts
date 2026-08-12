import { apiRequest, authRequest } from '@/lib/api-client';
import { VN_PHONE } from './schemas';

function toContact(identifier: string) {
  const value = identifier.trim();
  return VN_PHONE.test(value) ? { phone: value } : { email: value.toLowerCase() };
}

/**
 * These four hit the dedicated /api/auth/* Route Handlers (not the generic
 * proxy) because they are the only place allowed to set or clear the session
 * cookies. Each returns the access token for React Query to hold in memory.
 */

export interface AuthResult {
  accessToken: string;
}

export function login(input: { identifier: string; password: string }) {
  return authRequest<AuthResult>('/login', { phone: input.identifier.trim(), password: input.password });
}

// Registration creates the account only — it returns no token and starts no
// session. The user signs in afterwards on /login.
export function register(input: {
  identifier: string;
  password: string;
  fullName?: string;
  otpCode: string;
}) {
  return authRequest<{ ok: true }>('/register', { phone: input.identifier.trim(), password: input.password, fullName: input.fullName, otpCode: input.otpCode });
}

export function sendRegisterOtp(identifier: string) {
  return apiRequest<{ success: true }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ phone: identifier.trim(), purpose: 'register' }),
  });
}

export function googleLogin(input: { idToken: string }) {
  return authRequest<AuthResult>('/google', input);
}

export function facebookLogin(input: { accessToken: string }) {
  return authRequest<AuthResult>('/facebook', input);
}

export function logout() {
  return authRequest<{ success: true }>('/logout');
}

/**
 * Password reset is two public backend calls (no cookies set), so they go through
 * the generic proxy rather than the dedicated /api/auth handlers.
 */
export function sendResetOtp(identifier: string) {
  return apiRequest<{ success: true }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ ...toContact(identifier), purpose: 'reset_password' }),
  });
}

export function resetPassword(input: {
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
}) {
  return apiRequest<{ success: true }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function verifyResetOtp(input: { email?: string; phone?: string; code: string }) {
  return apiRequest<{ success: true }>('/auth/otp/verify-reset', {
    method: 'POST',
    body: JSON.stringify({ ...input, purpose: 'reset_password' }),
  });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ success: true }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function sendContactPhoneOtp(phone: string) {
  return apiRequest<{ success: true }>('/auth/otp/send-contact-phone', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyContactPhoneOtp(input: { phone: string; code: string }) {
  return apiRequest<{ success: true }>('/auth/otp/verify-contact-phone', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
