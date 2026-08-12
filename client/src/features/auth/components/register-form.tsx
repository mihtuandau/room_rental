'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { registerSchema, type RegisterInput } from '../schemas';
import { useRegister, useSendRegisterOtp } from '../hooks';
import { Field } from './field';
import { PasswordRequirements } from './password-requirements';
import { AuthStepTransition } from './auth-step-transition';

export function RegisterForm({ next = '/' }: { next?: string }) {
  const router = useRouter();
  const registerMutation = useRegister();
  const sendOtpMutation = useSendRegisterOtp();
  const [otpStep, setOtpStep] = useState(false);
  const [stepDirection, setStepDirection] = useState<'forward' | 'back'>('forward');

  const { register, handleSubmit, setError, getValues, trigger, control, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const passwordValue = useWatch({ control, name: 'password', defaultValue: '' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync({ identifier: values.identifier, password: values.password, fullName: values.fullName?.trim() || undefined, otpCode: values.otpCode });
      toast.success('Đã tạo tài khoản. Bạn đăng nhập để tiếp tục.');
      router.push(next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('identifier', { message: 'Thông tin này đã được đăng ký. Bạn thử đăng nhập nhé.' });
      else if (err instanceof ApiError && err.status === 429) setError('root', { message: 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại.' });
      else if (err instanceof ApiError && (err.status === 401 || err.status === 403)) setError('otpCode', { message: 'Mã xác minh không đúng hoặc đã hết hạn.' });
      else toast.error('Không đăng ký được, thử lại sau.');
    }
  });

  async function sendOtp() {
    if (!(await trigger(['fullName', 'identifier', 'password'], { shouldFocus: true }))) return;
    try {
      await sendOtpMutation.mutateAsync(getValues('identifier'));
      setStepDirection('forward');
      setOtpStep(true);
      toast.success('Đã gửi mã xác minh.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('identifier', { message: 'Thông tin này đã được đăng ký. Bạn thử đăng nhập nhé.' });
      else if (err instanceof ApiError && err.status === 429) setError('root', { message: 'Bạn đã gửi mã quá nhiều lần. Đợi một phút rồi thử lại.' });
      else toast.error('Không gửi được mã xác minh. Thử lại sau.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <AuthStepTransition stepKey={otpStep ? 'register-otp' : 'register-details'} direction={stepDirection} className="space-y-4">
      {otpStep ? (
        <>
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-900">
            Mã xác minh đã được gửi đến <strong>{getValues('identifier')}</strong>. Nhập mã để hoàn tất đăng ký.
          </div>
          <Field id="otpCode" label="Mã xác minh" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={6} error={errors.otpCode?.message} {...register('otpCode')} />
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => { setStepDirection('back'); setOtpStep(false); }}>Quay lại</Button>
            <Button type="button" variant="outline" disabled={sendOtpMutation.isPending} onClick={() => void sendOtp()}>{sendOtpMutation.isPending ? 'Đang gửi…' : 'Gửi lại mã'}</Button>
          </div>
          {errors.root && <p role="alert" className="rounded-md bg-danger-50 p-3 text-sm text-danger-600">{errors.root.message}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo tài khoản…' : 'Xác nhận đăng ký'}</Button>
        </>
      ) : (
        <>
          <Field id="fullName" label="Họ tên" autoComplete="name" placeholder="Nguyễn Văn A" error={errors.fullName?.message} {...register('fullName')} />
          <Field id="identifier" label="Số điện thoại" inputMode="tel" autoComplete="tel" placeholder="0912345678" error={errors.identifier?.message} {...register('identifier')} />
          <Field id="password" label="Mật khẩu" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <PasswordRequirements value={passwordValue} />
          {errors.root && <p role="alert" className="rounded-md bg-danger-50 p-3 text-sm text-danger-600">{errors.root.message}</p>}
          <Button type="button" size="lg" className="w-full" disabled={sendOtpMutation.isPending} onClick={() => void sendOtp()}>{sendOtpMutation.isPending ? 'Đang đăng ký…' : 'Đăng ký'}</Button>
        </>
      )}
      </AuthStepTransition>
    </form>
  );
}
