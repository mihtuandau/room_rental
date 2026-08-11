'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import {
  login,
  register,
  googleLogin,
  facebookLogin,
  logout,
  sendResetOtp,
  resetPassword,
  sendRegisterOtp,
  changePassword,
  verifyResetOtp,
  sendContactPhoneOtp,
  verifyContactPhoneOtp,
} from './api';
import { profileKeys } from '@/features/users/hooks';

/**
 * On any successful sign-in the access token goes into the in-memory auth store
 * (never localStorage). The refresh cookie is already set by the Route Handler,
 * so a reload restores the session via AuthBootstrap.
 */
function useAuthSuccess() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  return (accessToken: string) => setAccessToken(accessToken);
}

export function useLogin() {
  const onAuth = useAuthSuccess();
  return useMutation({
    mutationFn: login,
    onSuccess: ({ accessToken }) => onAuth(accessToken),
  });
}

// No token to store — registration doesn't sign the user in; they go to /login.
export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useSendRegisterOtp() {
  return useMutation({ mutationFn: sendRegisterOtp });
}

export function useGoogleLogin() {
  const onAuth = useAuthSuccess();
  return useMutation({
    mutationFn: googleLogin,
    onSuccess: ({ accessToken }) => onAuth(accessToken),
  });
}

export function useFacebookLogin() {
  const onAuth = useAuthSuccess();
  return useMutation({
    mutationFn: facebookLogin,
    onSuccess: ({ accessToken }) => onAuth(accessToken),
  });
}

// Password reset returns no token, so these don't touch the auth store.
export function useSendResetOtp() {
  return useMutation({ mutationFn: sendResetOtp });
}

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword });
}

export function useSendContactPhoneOtp() {
  return useMutation({ mutationFn: sendContactPhoneOtp });
}

export function useVerifyContactPhoneOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyContactPhoneOtp,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}

export function useVerifyResetOtp() {
  return useMutation({ mutationFn: verifyResetOtp });
}

export function useLogout() {
  const qc = useQueryClient();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setAccessToken(null);
      // Drop every cached query so the next user never sees the previous one's data.
      qc.clear();
      toast.success('Đã đăng xuất.');
    },
    onError: () => toast.error('Không đăng xuất được, thử lại nhé.'),
  });
}
