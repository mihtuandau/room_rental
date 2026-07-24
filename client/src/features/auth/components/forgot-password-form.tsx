'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '../schemas';
import { useSendResetOtp, useResetPassword } from '../hooks';
import { Field } from './field';

const RESEND_SECONDS = 60;

export function ForgotPasswordForm() {
  const router = useRouter();
  const [phone, setPhone] = useState<string | null>(null);

  // Step 1 collects the phone and sends the code; step 2 appears once we have it.
  return phone === null ? (
    <PhoneStep onSent={setPhone} />
  ) : (
    <ResetStep phone={phone} onDone={() => router.push('/login')} />
  );
}

function PhoneStep({ onSent }: { onSent: (phone: string) => void }) {
  const sendOtp = useSendResetOtp();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = handleSubmit(async ({ phone }) => {
    try {
      await sendOtp.mutateAsync(phone);
      toast.success('Đã gửi mã xác minh tới số điện thoại của bạn.');
      onSent(phone);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('phone', {
          message: 'Bạn gửi hơi nhanh. Đợi một chút rồi thử lại.',
        });
      } else {
        // The backend replies the same whether or not the phone exists, so an
        // attacker can't tell registered numbers apart — mirror that here.
        toast.error('Không gửi được mã, thử lại sau.');
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-zinc-600">
        Nhập số điện thoại đã đăng ký, chúng tôi sẽ gửi mã xác minh để bạn đặt lại mật khẩu.
      </p>
      <Field
        id="phone"
        label="Số điện thoại"
        inputMode="tel"
        autoComplete="tel"
        placeholder="0912345678"
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang gửi…' : 'Gửi mã xác minh'}
      </Button>
    </form>
  );
}

function ResetStep({ phone, onDone }: { phone: string; onDone: () => void }) {
  const resetPassword = useResetPassword();
  const resendOtp = useSendResetOtp();
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = handleSubmit(async ({ code, newPassword }) => {
    try {
      await resetPassword.mutateAsync({ phone, code, newPassword });
      toast.success('Đã đặt lại mật khẩu. Bạn đăng nhập lại nhé.');
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('code', {
          message: 'Mã xác minh không đúng hoặc đã hết hạn.',
        });
      } else {
        toast.error('Không đặt lại được mật khẩu, thử lại sau.');
      }
    }
  });

  const onResend = async () => {
    try {
      await resendOtp.mutateAsync(phone);
      toast.success('Đã gửi lại mã xác minh.');
      setCooldown(RESEND_SECONDS);
    } catch {
      toast.error('Không gửi lại được mã, thử lại sau.');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-zinc-600">
        Nhập mã xác minh đã gửi tới <span className="font-medium">{phone}</span> và đặt
        mật khẩu mới.
      </p>

      <div>
        <Field
          id="code"
          label="Mã xác minh"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="123456"
          error={errors.code?.message}
          {...register('code')}
        />
        <div className="mt-1.5">
          <button
            type="button"
            onClick={onResend}
            disabled={cooldown > 0 || resendOtp.isPending}
            className="rounded-md text-sm text-brand-700 transition-colors hover:text-brand-900 disabled:cursor-not-allowed disabled:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
          </button>
        </div>
      </div>

      <Field
        id="newPassword"
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />

      <Field
        id="confirmNewPassword"
        label="Nhập lại mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        {...register('confirmNewPassword')}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
      </Button>
    </form>
  );
}
