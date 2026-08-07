'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Eye, KeyRound, Laptop, LockKeyhole, LogOut, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ErrorState } from '@/components/ui/states';
import { Skeleton } from '@/components/ui/skeleton';
import { useChangePassword, useResetPassword, useSendResetOtp, useVerifyResetOtp } from '@/features/auth/hooks';
import { changePasswordSchema, resetPasswordSchema, type ChangePasswordInput, type ResetPasswordInput } from '@/features/auth/schemas';
import { PasswordRequirements } from '@/features/auth/components/password-requirements';
import { useProfile } from '@/features/users/hooks';

function StatusItem({ icon, label, value, verified }: { icon: React.ReactNode; label: string; value: string; verified: boolean }) {
  return (
    <div className={`min-w-0 rounded-xl border p-3.5 transition-colors ${verified ? 'border-brand-100 bg-brand-50/40' : 'border-zinc-200 bg-zinc-50/70'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${verified ? 'bg-brand-100 text-brand-700' : 'bg-white text-zinc-500'}`} aria-hidden>{icon}</span>
        <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${verified ? 'bg-brand-100 text-brand-700' : 'bg-zinc-200 text-zinc-600'}`}>
          {verified ? 'Đã xác minh' : 'Chưa xác minh'}
        </span>
      </div>
      <p className="mt-3 text-xs text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-zinc-900" title={value}>{value}</p>
    </div>
  );
}

function CreatePasswordPanel({ email }: { email: string | null }) {
  const [step, setStep] = useState<'start' | 'verify' | 'password'>('start');
  const sendOtp = useSendResetOtp();
  const verifyOtp = useVerifyResetOtp();
  const resetPassword = useResetPassword();
  const { register, control, getValues, handleSubmit, formState: { errors } } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', newPassword: '', confirmNewPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword', defaultValue: '' });

  async function requestOtp() {
    if (!email) return;
    try {
      await sendOtp.mutateAsync(email);
      setStep('verify');
      toast.success('Đã gửi mã xác minh đến email của bạn.');
    } catch {
      toast.error('Không gửi được mã xác minh. Vui lòng thử lại.');
    }
  }

  async function verifyCode() {
    if (!email) return;
    const code = getValues('code');
    try {
      await verifyOtp.mutateAsync({ email, code });
      setStep('password');
      toast.success('Mã xác minh hợp lệ.');
    } catch {
      toast.error('Mã xác minh không đúng hoặc đã hết hạn.');
    }
  }

  async function onSubmit(values: ResetPasswordInput) {
    if (!email) return;
    try {
      await resetPassword.mutateAsync({ email, code: values.code, newPassword: values.newPassword });
      toast.success('Đã tạo mật khẩu cho tài khoản Trọ Ơi.');
      setStep('start');
    } catch {
      toast.error('Mã xác minh không đúng hoặc đã hết hạn.');
    }
  }

  return (
    <section role="tabpanel" className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><KeyRound className="h-4 w-4" aria-hidden /></span><div className="min-w-0"><h2 className="font-semibold text-zinc-900">Tạo mật khẩu</h2><p className="text-sm text-zinc-600">Tài khoản Google của bạn chưa có mật khẩu Trọ Ơi.</p></div></div>
      {!email ? <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Hãy thêm email và xác minh email trước khi tạo mật khẩu.</p> : <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
        {step === 'start' && <><p className="text-sm text-zinc-600">Chúng tôi sẽ gửi mã xác minh đến <strong className="font-medium text-zinc-900">{email}</strong>.</p><Button type="button" onClick={() => void requestOtp()} disabled={sendOtp.isPending}>{sendOtp.isPending ? 'Đang gửi mã…' : 'Gửi mã xác minh'}</Button></>}
        {step === 'verify' && <><div><label htmlFor="setupCode" className="mb-1.5 block text-sm font-medium text-zinc-700">Mã xác minh</label><Input id="setupCode" inputMode="numeric" autoComplete="one-time-code" error={Boolean(errors.code)} {...register('code')} />{errors.code && <p className="mt-1 text-xs text-danger-600">{errors.code.message}</p>}</div><div className="flex flex-wrap items-center justify-between gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setStep('start')}>Gửi lại mã</Button><Button type="button" onClick={() => void verifyCode()} disabled={verifyOtp.isPending}>{verifyOtp.isPending ? 'Đang xác minh…' : 'Xác minh mã'}</Button></div></>}
        {step === 'password' && <><p className="text-sm text-brand-700">Mã đã được xác minh. Tạo mật khẩu riêng cho Trọ Ơi.</p><div><label htmlFor="setupNewPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">Mật khẩu mới</label><Input id="setupNewPassword" type="password" autoComplete="new-password" error={Boolean(errors.newPassword)} {...register('newPassword')} />{errors.newPassword && <p className="mt-1 text-xs text-danger-600">{errors.newPassword.message}</p>}<PasswordRequirements value={newPassword} /></div><div><label htmlFor="setupConfirmPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">Nhập lại mật khẩu mới</label><Input id="setupConfirmPassword" type="password" autoComplete="new-password" error={Boolean(errors.confirmNewPassword)} {...register('confirmNewPassword')} />{errors.confirmNewPassword && <p className="mt-1 text-xs text-danger-600">{errors.confirmNewPassword.message}</p>}</div><div className="flex justify-end"><Button type="submit" disabled={resetPassword.isPending}>{resetPassword.isPending ? 'Đang tạo…' : 'Tạo mật khẩu'}</Button></div></>}
      </form>}
    </section>
  );
}

function DeviceManagementPanel() {
  const [device, setDevice] = useState({ name: 'Thiết bị hiện tại', platform: 'Đang nhận diện thiết bị', location: 'Phiên đang hoạt động' });

  useEffect(() => {
    const ua = navigator.userAgent;
    const browser = ua.includes('Edg/') ? 'Microsoft Edge' : ua.includes('Chrome/') ? 'Chrome' : ua.includes('Safari/') ? 'Safari' : 'Trình duyệt web';
    const platform = /iPhone|iPad|Android/i.test(ua) ? 'Thiết bị di động' : 'Windows/macOS';
    // Browser metadata is an external client-only signal; sync it once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read navigator metadata after hydration
    setDevice({ name: `${browser} trên ${platform}`, platform: 'Thiết bị hiện tại', location: 'Đang hoạt động' });
  }, []);

  return (
    <section role="tabpanel" className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-zinc-900">Quản lý thiết bị</h2><p className="mt-1 text-sm text-zinc-600">Kiểm tra nơi tài khoản của bạn đang đăng nhập.</p></div><Laptop className="h-5 w-5 text-zinc-400" aria-hidden /></div>
      <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/40 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Laptop className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-900">{device.name}</p><p className="text-xs text-zinc-600">{device.platform} · {device.location}</p></div>
        <span className="ml-auto shrink-0 text-xs font-medium text-brand-700">Thiết bị hiện tại</span>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-center"><p className="text-sm font-medium text-zinc-700">Chưa có thiết bị khác</p><p className="mt-1 text-xs text-zinc-500">Danh sách các phiên đăng nhập khác sẽ xuất hiện khi hệ thống quản lý phiên được bật.</p></div>
      <Button type="button" variant="outline" size="sm" disabled><LogOut className="h-4 w-4" aria-hidden />Đăng xuất thiết bị khác</Button>
    </section>
  );
}

export function AccountSecurityView() {
  const { data: profile, isPending, isError, refetch } = useProfile();
  const changePassword = useChangePassword();
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword', defaultValue: '' });
  const [activeTab, setActiveTab] = useState<'password' | 'two-factor' | 'devices' | 'privacy'>('password');

  if (isPending) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  async function onSubmit(values: ChangePasswordInput) {
    try {
      await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      reset();
      toast.success('Đã đổi mật khẩu.');
    } catch {
      toast.error('Không đổi được mật khẩu. Hãy kiểm tra mật khẩu hiện tại và thử lại.');
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="font-semibold text-zinc-900">Tổng quan bảo mật</h2>
          <p className="mt-1 text-sm text-zinc-600">Các phương  thức bạn có thể dùng để đăng nhập và khôi phục tài khoản.</p>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <StatusItem icon={<Smartphone className="h-4 w-4" />} label="Số điện thoại" value={profile.phone ?? 'Chưa thêm số'} verified={Boolean(profile.phone && profile.isPhoneVerified)} />
          <StatusItem icon={<Mail className="h-4 w-4" />} label="Email" value={profile.email ?? 'Chưa thêm email'} verified={Boolean(profile.email && profile.isEmailVerified)} />
          <StatusItem icon={<span className="font-bold">G</span>} label="Google" value={profile.googleLinked ? 'Đã liên kết' : 'Chưa liên kết'} verified={profile.googleLinked} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-start">
        <div role="tablist" aria-label="Cài đặt bảo mật" className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-1 lg:flex-col lg:overflow-visible">
          {[
            ['password', 'Đổi mật khẩu', <KeyRound className="h-4 w-4" key="password-icon" />],
            ['two-factor', 'Xác thực 2 lớp', <LockKeyhole className="h-4 w-4" key="two-factor-icon" />],
            ['devices', 'Thiết bị', <Laptop className="h-4 w-4" key="devices-icon" />],
            ['privacy', 'Quyền riêng tư', <Eye className="h-4 w-4" key="privacy-icon" />],
          ].map(([value, label, icon]) => (
            <button key={String(value)} type="button" role="tab" aria-selected={activeTab === value} onClick={() => setActiveTab(value as typeof activeTab)} className={`flex min-h-10 shrink-0 items-center justify-start gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${activeTab === value ? 'bg-white text-brand-700 shadow-sm' : 'text-zinc-600 hover:bg-white/70'}`}>
              {icon}<span>{label}</span>
            </button>
          ))}
        </div>

        <div className="min-w-0">{activeTab === 'password' ? (profile.hasPassword ? <section role="tabpanel" className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700"><KeyRound className="h-4 w-4" aria-hidden /></span><div className="min-w-0"><h2 className="font-semibold text-zinc-900">Đổi mật khẩu</h2><p className="text-sm text-zinc-600">Cập nhật định kỳ để bảo vệ tài khoản.</p></div></div>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
            <div><label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">Mật khẩu hiện tại</label><Input id="currentPassword" type="password" autoComplete="current-password" error={Boolean(errors.currentPassword)} {...register('currentPassword')} />{errors.currentPassword && <p className="mt-1 text-xs text-danger-600">{errors.currentPassword.message}</p>}</div>
            <div><label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">Mật khẩu mới</label><Input id="newPassword" type="password" autoComplete="new-password" error={Boolean(errors.newPassword)} {...register('newPassword')} />{errors.newPassword && <p className="mt-1 text-xs text-danger-600">{errors.newPassword.message}</p>}<PasswordRequirements value={newPassword} /></div>
            <div><label htmlFor="confirmNewPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">Nhập lại mật khẩu mới</label><Input id="confirmNewPassword" type="password" autoComplete="new-password" error={Boolean(errors.confirmNewPassword)} {...register('confirmNewPassword')} />{errors.confirmNewPassword && <p className="mt-1 text-xs text-danger-600">{errors.confirmNewPassword.message}</p>}</div>
            <div className="flex justify-end"><Button type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? 'Đang cập nhật…' : 'Lưu mật khẩu mới'}</Button></div>
          </form>
        </section> : <CreatePasswordPanel email={profile.email && profile.isEmailVerified ? profile.email : null} />) : null}

          {activeTab === 'two-factor' && <section role="tabpanel" className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500"><LockKeyhole className="h-4 w-4" aria-hidden /></span><div><h2 className="font-semibold text-zinc-900">Xác thực 2 lớp</h2><p className="mt-1 text-sm text-zinc-600">Tính năng này chưa được triển khai. Bạn sẽ có thể thêm một lớp bảo vệ bằng ứng dụng xác thực trong phiên bản sắp tới.</p><span className="mt-3 inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">Sắp ra mắt</span></div></div></section>}

          {activeTab === 'devices' && <DeviceManagementPanel />}

          {activeTab === 'privacy' && <section role="tabpanel" className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><Eye className="h-4 w-4" aria-hidden /></span><div><h2 className="font-semibold text-zinc-900">Cài đặt quyền riêng tư</h2><p className="mt-1 text-sm text-zinc-600">Bạn có thể kiểm soát thông tin liên hệ hiển thị trên tin đăng trong trang Hồ sơ cá nhân. Các tuỳ chọn nâng cao sẽ được bổ sung sau.</p><ul className="mt-3 space-y-1.5 text-sm text-zinc-600"><li>Không chia sẻ mã OTP hoặc mật khẩu cho bất kỳ ai.</li><li>Chỉ cung cấp thông tin liên hệ cần thiết khi đăng tin.</li></ul></div></div></section>}
        </div>
      </div>
    </div>
  );
}
