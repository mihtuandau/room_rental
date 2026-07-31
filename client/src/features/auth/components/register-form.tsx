'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { registerSchema, type RegisterInput } from '../schemas';
import { useRegister, useSendRegisterOtp } from '../hooks';
import { Field } from './field';

export function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const registerMutation = useRegister();
  const sendOtpMutation = useSendRegisterOtp();
  const [otpSent, setOtpSent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync({
        phone: values.phone,
        password: values.password,
        // an empty optional field must not be sent as ""
        fullName: values.fullName?.trim() || undefined,
        otpCode: values.otpCode,
      });
      toast.success('Đã tạo tài khoản. Bạn đăng nhập để tiếp tục.');
      // Registration doesn't sign the user in — send them to /login, preserving
      // where they were headed. Phone is not passed in the URL (it's personal data).
      router.push(next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // phone already registered — the actionable field is the phone
        setError('phone', {
          message: 'Số điện thoại này đã được đăng ký. Bạn thử đăng nhập nhé.',
        });
      } else if (err instanceof ApiError && err.status === 429) {
        setError('root', {
          message: 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại.',
        });
      } else if (
        err instanceof ApiError &&
        (err.status === 401 || err.status === 403)
      ) {
        setError('otpCode', {
          message:
            'Mã xác minh không đúng hoặc đã hết hạn. Bạn gửi lại mã rồi thử lại.',
        });
      } else {
        toast.error('Không đăng ký được, thử lại sau.');
      }
    }
  });

  async function sendOtp() {
    if (!(await trigger('phone', { shouldFocus: true }))) return;
    try {
      await sendOtpMutation.mutateAsync(getValues('phone'));
      setOtpSent(true);
      toast.success('Đã gửi mã xác minh đến số điện thoại của bạn.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('phone', {
          message:
            'Số điện thoại này đã được đăng ký. Bạn thử đăng nhập nhé.',
        });
      } else if (err instanceof ApiError && err.status === 429) {
        setError('root', {
          message:
            'Bạn đã gửi mã nhiều lần. Đợi một phút rồi thử lại.',
        });
      } else {
        toast.error('Không gửi được mã xác minh. Bạn thử lại sau.');
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        id="fullName"
        label="Họ tên"
        autoComplete="name"
        placeholder="Nguyễn Văn A"
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <Field
        id="phone"
        label="Số điện thoại"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0912345678"
        error={errors.phone?.message}
        {...register('phone')}
      />

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
        <Field
          id="otpCode"
          label="Mã xác minh"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          maxLength={6}
          error={errors.otpCode?.message}
          {...register('otpCode')}
        />
        <Button
          type="button"
          variant="outline"
          className="mb-px"
          disabled={sendOtpMutation.isPending}
          onClick={() => void sendOtp()}
        >
          {sendOtpMutation.isPending
            ? 'Đang gửi…'
            : otpSent
              ? 'Gửi lại mã'
              : 'Gửi mã'}
        </Button>
      </div>

      <Field
        id="password"
        label="Mật khẩu"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Field
        id="confirmPassword"
        label="Nhập lại mật khẩu"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      {errors.root && (
        <p
          role="alert"
          className="rounded-md bg-danger-50 p-3 text-sm text-danger-600"
        >
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang tạo tài khoản…' : 'Đăng ký'}
      </Button>
    </form>
  );
}
