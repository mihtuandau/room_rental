'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/states';
import { useAuthStore } from '@/stores/auth-store';

/** UX guard for private screens; the backend remains authoritative. */
export function AuthRequired({
  children,
  nextPath,
}: {
  children: React.ReactNode;
  nextPath?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const accessToken = useAuthStore((state) => state.accessToken);
  const destination = nextPath ?? pathname;
  const loginHref = `/login?next=${encodeURIComponent(destination)}`;

  useEffect(() => {
    if (isBootstrapped && !accessToken) router.replace(loginHref);
  }, [accessToken, isBootstrapped, loginHref, router]);

  if (!isBootstrapped) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Đang kiểm tra phiên đăng nhập">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!accessToken) {
    return (
      <EmptyState
        icon={<LockKeyhole className="h-8 w-8" aria-hidden />}
        title="Đăng nhập để tiếp tục"
        description="Phiên này chỉ dành cho tài khoản đã đăng nhập. Bạn sẽ được đưa tới trang đăng nhập để tiếp tục."
        action={{ label: 'Đăng nhập', href: loginHref }}
      />
    );
  }

  return <>{children}</>;
}
