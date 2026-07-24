'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { registerSchema, type RegisterInput } from '../schemas';
import { useRegister } from '../hooks';
import { Field } from './field';

export function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync({
        phone: values.phone,
        password: values.password,
        // an empty optional field must not be sent as ""
        fullName: values.fullName?.trim() || undefined,
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
      } else {
        toast.error('Không đăng ký được, thử lại sau.');
      }
    }
  });

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
