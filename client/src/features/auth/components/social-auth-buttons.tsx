'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { GoogleSignInButton } from './google-sign-in-button';

function ComingSoonSocialButton({
  label,
  src,
  onClick,
}: {
  label: string;
  src: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} đang được phát triển`}
      aria-label={`${label} (đang được phát triển)`}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <Image src={src} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
      <span>{label}</span>
    </button>
  );
}

export function SocialAuthButtons({ next = '/' }: { next?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2.5" aria-label="Đăng nhập bằng mạng xã hội">
      <GoogleSignInButton next={next} compact label="Google" />
      <ComingSoonSocialButton
        label="Facebook"
        src="/logofacebook.png"
        onClick={() => toast.info('Đăng nhập Facebook đang được phát triển.')}
      />
    </div>
  );
}
