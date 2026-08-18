'use client';

import { ShieldAlert } from 'lucide-react';
import { ApiError, isForbiddenError } from '@/lib/api-client';
import { useProfile } from '@/features/users/hooks';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';
import { ErrorState, EmptyState, PermissionDeniedState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminAccessGate({ children }: { children: React.ReactNode }) {
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const isSignedIn = useIsSignedIn();
  const { data: profile, error, isError, isPending, refetch } = useProfile();

  if (!isBootstrapped || (isSignedIn && isPending)) {
    return <AdminLayoutSkeleton />;
  }

  if (!isSignedIn || (isError && error instanceof ApiError && error.status === 401)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-10 w-10" aria-hidden />}
        title="Bạn cần đăng nhập"
        description="Đăng nhập bằng tài khoản quản trị để tiếp tục."
        action={{ label: 'Đăng nhập', href: '/login?next=%2Fadmin' }}
      />
    );
  }

  if (isError) {
    if (isForbiddenError(error)) return <PermissionDeniedState />;
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (profile?.role !== 'admin') {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-10 w-10" aria-hidden />}
        title="Bạn không có quyền truy cập khu vực quản trị"
        description="Khu vực này chỉ dành cho quản trị viên. Bạn có thể tiếp tục tìm phòng hoặc quản lý tin đăng của mình."
        action={{ label: 'Về trang tìm phòng', href: '/' }}
      />
    );
  }

  return <>{children}</>;
}

function AdminLayoutSkeleton() {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-brand-50/40 p-4 md:block">
        <Skeleton className="h-10 w-40" />
        <div className="mt-10 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </aside>
      <main className="min-w-0 flex-1 bg-zinc-50 p-4 sm:p-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="mt-3 h-5 w-full max-w-md" />
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    </div>
  );
}
