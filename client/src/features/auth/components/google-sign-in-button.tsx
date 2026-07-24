'use client';

import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'sonner';
import { useGoogleLogin } from '../hooks';

/**
 * A Google account has no phone number, so the user can browse but cannot post a
 * listing until they add a contact phone — the post-listing form handles that
 * 400 and routes them to their profile.
 */
export function GoogleSignInButton({ next = '/' }: { next?: string }) {
  const router = useRouter();
  const googleLogin = useGoogleLogin();

  return (
    <GoogleLogin
      width="320"
      onSuccess={async (res) => {
        if (!res.credential) {
          toast.error('Đăng nhập Google thất bại.');
          return;
        }
        try {
          await googleLogin.mutateAsync({ idToken: res.credential });
          router.push(next);
          router.refresh();
        } catch {
          toast.error('Đăng nhập Google thất bại.');
        }
      }}
      onError={() => {
        toast.error('Đăng nhập Google thất bại.');
      }}
    />
  );
}
