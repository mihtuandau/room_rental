import Link from 'next/link';
import { House } from 'lucide-react';

/**
 * Bare, centred chrome for the auth screens — a "Đăng tin" button and a full
 * footer here would only distract from the one task. The logo links home so a
 * user who landed here by mistake can get back out.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center px-4 py-10 sm:py-16">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-600 text-white">
          <House className="h-5 w-5" aria-hidden />
        </span>
        RoomRent
      </Link>
      <main className="w-full max-w-sm">{children}</main>
    </div>
  );
}
