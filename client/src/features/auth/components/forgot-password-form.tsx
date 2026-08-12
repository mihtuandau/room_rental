'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { forgotPasswordSchema, resetPasswordSchema, type ForgotPasswordInput, type ResetPasswordInput } from '../schemas';
import { useSendResetOtp, useResetPassword, useVerifyResetOtp } from '../hooks';
import { Field } from './field';
import { PasswordRequirements } from './password-requirements';
import { AuthStepTransition } from './auth-step-transition';

const RESEND_SECONDS = 60;
type Contact = { phone: string };
const otpOnlySchema = z.object({ code: z.string().regex(/^\d{6}$/, 'Mã xác minh gồm 6 chữ số.') });

export function ForgotPasswordForm() {
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const step = !contact ? 'forgot-contact' : !code ? 'forgot-otp' : 'forgot-password';
  return <AuthStepTransition stepKey={step}>
    {!contact ? <ContactStep onSent={setContact} /> : !code ? <OtpStep contact={contact} onVerified={setCode} /> : <PasswordStep contact={contact} code={code} onCodeExpired={() => setCode(null)} onDone={() => router.push('/login')} />}
  </AuthStepTransition>;
}

function ContactStep({ onSent }: { onSent: (contact: Contact) => void }) {
  const sendOtp = useSendResetOtp();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });
  const onSubmit = handleSubmit(async ({ identifier }) => {
    try {
      await sendOtp.mutateAsync(identifier);
      onSent({ phone: identifier.trim() });
      toast.success('Nếu thông tin đã đăng ký, mã xác minh sẽ được gửi đến bạn.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setError('root', { message: 'Bạn thao tác hơi nhanh. Vui lòng thử lại sau.' });
      else toast.error('Không gửi được mã, thử lại sau.');
    }
  });
  return <form onSubmit={onSubmit} className="space-y-4" noValidate>
    <p className="text-sm text-zinc-600">Nhập số điện thoại đã đăng ký để nhận mã xác minh.</p>
    <Field id="identifier" label="Số điện thoại" inputMode="tel" autoComplete="tel" placeholder="0912345678" error={errors.identifier?.message} {...register('identifier')} />
    {errors.root && <p role="alert" className="rounded-md bg-danger-50 p-3 text-sm text-danger-600">{errors.root.message}</p>}
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Đang gửi…' : 'Gửi mã xác minh'}</Button>
  </form>;
}

function OtpStep({ contact, onVerified }: { contact: Contact; onVerified: (code: string) => void }) {
  const resendOtp = useSendResetOtp();
  const verifyOtp = useVerifyResetOtp();
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<{ code: string }>({ resolver: zodResolver(otpOnlySchema) });
  useEffect(() => { if (cooldown > 0) { const id = setTimeout(() => setCooldown((s) => s - 1), 1000); return () => clearTimeout(id); } }, [cooldown]);
  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      await verifyOtp.mutateAsync({ phone: contact.phone, code });
      onVerified(code);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setError('code', {
          message: 'Mã xác minh không đúng hoặc đã hết hạn. Hãy gửi lại mã mới.',
        });
      } else {
        toast.error('Không xác minh được mã. Kiểm tra kết nối và thử lại.');
      }
    }
  });
  const onResend = async () => { try { await resendOtp.mutateAsync(contact.phone); setCooldown(RESEND_SECONDS); toast.success('Đã gửi lại mã xác minh.'); } catch (err) { if (err instanceof ApiError && err.status === 429) setError('code', { message: 'Bạn gửi mã quá nhanh.' }); else toast.error('Không gửi lại được mã.'); } };
  return <form onSubmit={onSubmit} className="space-y-4" noValidate>
    <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">Nhập mã xác minh đã gửi tới <strong>{contact.phone}</strong>.</div>
    <Field id="code" label="Mã xác minh" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" error={errors.code?.message} {...register('code')} />
    <button type="button" onClick={() => void onResend()} disabled={cooldown > 0 || resendOtp.isPending} className="text-sm text-brand-700 disabled:text-zinc-400">{cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}</button>
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || verifyOtp.isPending}>{isSubmitting || verifyOtp.isPending ? 'Đang xác minh…' : 'Tiếp tục'}</Button>
  </form>;
}

function PasswordStep({ contact, code, onCodeExpired, onDone }: { contact: Contact; code: string; onCodeExpired: () => void; onDone: () => void }) {
  const resetPassword = useResetPassword();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });
  const passwordValue = useWatch({ control, name: 'newPassword', defaultValue: '' });
  const onSubmit = handleSubmit(async ({ newPassword }) => {
    try { await resetPassword.mutateAsync({ ...contact, code, newPassword }); toast.success('Đã đặt lại mật khẩu. Bạn đăng nhập lại nhé.'); onDone(); }
    catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 401 || err.status === 403)) {
        toast.error('Mã xác minh không còn hiệu lực. Hãy nhập hoặc gửi lại mã mới.');
        onCodeExpired();
      } else {
        toast.error('Không đặt lại được mật khẩu. Kiểm tra kết nối và thử lại.');
      }
    }
  });
  return <form onSubmit={onSubmit} className="space-y-4" noValidate>
    <p className="text-sm text-zinc-600">Mã đã được xác minh. Hãy đặt mật khẩu mới.</p>
    <input type="hidden" value={code} {...register('code')} />
    <Field id="newPassword" label="Mật khẩu mới" type="password" autoComplete="new-password" error={errors.newPassword?.message} {...register('newPassword')} />
    <PasswordRequirements value={passwordValue} />
    <Field id="confirmNewPassword" label="Nhập lại mật khẩu mới" type="password" autoComplete="new-password" error={errors.confirmNewPassword?.message} {...register('confirmNewPassword')} />
    <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}</Button>
  </form>;
}
