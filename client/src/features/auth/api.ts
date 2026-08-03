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
  return authRequest<AuthResult>('/login', { ...toContact(input.identifier), password: input.password });
}

// Registration creates the account only — it returns no token and starts no
// session. The user signs in afterwards on /login.
export function register(input: {
  identifier: string;
  password: string;
  fullName?: string;
  otpCode: string;
}) {
  return authRequest<{ ok: true }>('/register', { ...toContact(input.identifier), password: input.password, fullName: input.fullName, otpCode: input.otpCode });
}

export function sendRegisterOtp(identifier: string) {
  return apiRequest<{ success: true }>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ ...toContact(identifier), purpose: 'register' }),
  });
}

export function googleLogin(input: { idToken: string }) {
  return authRequest<AuthResult>('/google', input);
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
  phone?: string;
  email?: string;
  code: string;
  newPassword: string;
}) {
  return apiRequest<{ success: true }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
