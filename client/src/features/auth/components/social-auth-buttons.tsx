'use client';

import Image from 'next/image';
import { toast } from 'sonner';
import { GoogleSignInButton } from './google-sign-in-button';
import { FacebookSignInButton } from './facebook-sign-in-button';

export function SocialAuthButtons({ next = '/' }: { next?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2.5" aria-label="Đăng nhập bằng mạng xã hội">
      <GoogleSignInButton next={next} compact label="Google" />
      <FacebookSignInButton next={next} label="Facebook" />
    </div>
  );
}
