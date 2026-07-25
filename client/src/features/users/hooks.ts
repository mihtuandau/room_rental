'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useIsSignedIn } from '@/stores/auth-store';
import { getProfile, updateProfile } from './api';

export const profileKeys = {
  me: ['profile', 'me'] as const,
};

export function useProfile() {
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: getProfile,
    enabled: isSignedIn,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      qc.setQueryData(profileKeys.me, profile);
      toast.success('Đã lưu thông tin.');
    },
    onError: () => toast.error('Không lưu được thông tin, thử lại nhé.'),
  });
}
