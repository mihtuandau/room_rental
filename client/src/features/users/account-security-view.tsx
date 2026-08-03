'use client';

import { Check, ShieldCheck, Smartphone, Unlink } from 'lucide-react';
import { useProfile } from '@/features/users/hooks';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';

export function AccountSecurityView() {
  const { data: profile, isPending, isError, refetch } = useProfile();

  if (isPending) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-zinc-900">Số điện thoại đăng nhập</h2>
            <p className="mt-1 text-sm text-zinc-600">{profile.phone}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {profile.isPhoneVerified ? 'Đã xác minh' : 'Chưa xác minh'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>@</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-zinc-900">Email đăng nhập</h2>
            <p className="mt-1 break-all text-sm text-zinc-600">{profile.email ?? 'Chưa thêm email'}</p>
            {profile.email && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700"><ShieldCheck className="h-3.5 w-3.5" aria-hidden />{profile.isEmailVerified ? 'Đã xác minh' : 'Chưa xác minh'}</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <span className="text-lg font-bold" aria-hidden>G</span>
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-zinc-900">Google</h2>
              <p className="mt-1 break-all text-sm text-zinc-600">
                {profile.googleLinked ? profile.email : 'Chưa liên kết tài khoản Google'}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                {profile.googleLinked ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-brand-700" aria-hidden />
                    Đã liên kết
                  </>
                ) : (
                  <>
                    <Unlink className="h-3.5 w-3.5" aria-hidden />
                    Chưa liên kết
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Liên kết Google giúp bạn đăng nhập nhanh hơn. Việc liên kết hoặc huỷ liên kết cần được thực hiện qua luồng xác thực an toàn.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="font-semibold text-zinc-900">Phương thức đăng nhập</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-600">
          Trọ Ơi hỗ trợ đăng nhập bằng email hoặc số điện thoại, kèm mã OTP để xác minh khi đăng ký và đặt lại mật khẩu.
        </p>
      </section>
    </div>
  );
}
