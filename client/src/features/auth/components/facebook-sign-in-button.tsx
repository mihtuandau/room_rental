'use client';

import { useRouter } from 'next/navigation';
import FacebookLogin from '@greatsumini/react-facebook-login';
import Image from 'next/image';
import { toast } from 'sonner';
import { useFacebookLogin } from '../hooks';

export function FacebookSignInButton({
  next = '/',
  label = 'Facebook',
}: {
  next?: string;
  label?: string;
}) {
  const router = useRouter();
  const facebookLoginMutation = useFacebookLogin();
  const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  const handleSuccess = async (response: { accessToken: string }) => {
    if (!response.accessToken) {
      toast.error('Đăng nhập Facebook thất bại.');
      return;
    }
    try {
      await facebookLoginMutation.mutateAsync({ accessToken: response.accessToken });
      router.push(next);
      router.refresh();
    } catch {
      toast.error('Đăng nhập Facebook thất bại.');
    }
  };

  if (!facebookAppId) {
    return (
      <button
        type="button"
        disabled
        className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-500"
      >
        <Image src="/logofacebook.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
        {label} (chưa cấu hình)
      </button>
    );
  }

  return (
    <div className="relative h-11 w-full overflow-hidden rounded-md">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
      >
        <Image src="/logofacebook.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
        <span className="text-sm font-medium text-zinc-700">{label}</span>
      </div>
      <div className="absolute inset-0 opacity-0 [&>button]:h-full [&>button]:w-full">
        <FacebookLogin
          appId={facebookAppId}
          onSuccess={handleSuccess}
          onFail={() => toast.error('Đăng nhập Facebook thất bại.')}
          initParams={{
            version: 'v18.0',
            xfbml: true,
          }}
          render={(renderProps) => (
            <button onClick={renderProps.onClick} type="button" aria-label="Đăng nhập bằng Facebook" />
          )}
        />
      </div>
    </div>
  );
}
