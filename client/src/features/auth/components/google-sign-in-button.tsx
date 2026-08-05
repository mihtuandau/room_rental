'use client';

import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import Image from 'next/image';
import { toast } from 'sonner';
import { useGoogleLogin } from '../hooks';

/**
 * A Google account has no phone number, so the user can browse but cannot post a
 * listing until they add a contact phone — the post-listing form handles that
 * 400 and routes them to their profile.
 */
export function GoogleSignInButton({
  next = '/',
  compact = false,
  label = 'Google',
}: {
  next?: string;
  compact?: boolean;
  label?: string;
}) {
  const router = useRouter();
  const googleLogin = useGoogleLogin();

  const handleSuccess = async (res: Parameters<NonNullable<React.ComponentProps<typeof GoogleLogin>['onSuccess']>>[0]) => {
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
  };

  const googleLoginControl = (
    <GoogleLogin
      width="320"
      onSuccess={handleSuccess}
      onError={() => toast.error('Đăng nhập Google thất bại.')}
    />
  );

  if (!compact) return googleLoginControl;

  return (
    <div className="relative h-11 w-full overflow-hidden rounded-md">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md border border-zinc-200 bg-white"
      >
        <Image src="/logogoogle.webp" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <div className="absolute inset-0 opacity-0 [&>div]:h-full [&>div]:w-full">
        {googleLoginControl}
      </div>
    </div>
  );
}
