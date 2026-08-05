import Image from 'next/image';
import Link from 'next/link';
import { GoogleAuthProvider } from '@/providers/google-auth-provider';
import { AuthPageTransition } from '@/features/auth/components/auth-page-transition';

/**
 * Bare, centred chrome for the auth screens — a "Đăng tin" button and a full
 * footer here would only distract from the one task. The logo links home so a
 * user who landed here by mistake can get back out.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleAuthProvider>
      <div className="flex min-h-screen flex-col items-center px-4 py-6 sm:py-12 bg-zinc-50">
        <Link
          href="/"
          className="mb-8 flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="Trọ Ơi"
            width={48}
            height={48}
            priority
            className="h-12 w-12"
          />
        </Link>
        <main className="w-full max-w-sm"><AuthPageTransition>{children}</AuthPageTransition></main>
      </div>
    </GoogleAuthProvider>
  );
}
