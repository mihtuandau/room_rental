'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getProfile } from '@/features/users/api';
import { profileKeys } from '@/features/users/hooks';
import { ApiError } from '@/lib/api-client';
import { loginSchema, type LoginInput } from '../schemas';
import { useLogin } from '../hooks';
import { Field } from './field';

export function LoginForm({ next = '/' }: { next?: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      const profile = await getProfile();
      queryClient.setQueryData(profileKeys.me, profile);

      const destination = next === '/' && profile.role === 'admin' ? '/admin/dashboard' : next;

      router.replace(destination);
      // Re-run Server Components so the header reflects the signed-in state.
      router.refresh();
    } catch (err) {
      // The backend returns one generic message for a wrong identifier OR password,
      // so it belongs on the form, not on a single field.
      if (err instanceof ApiError && err.status === 401) {
        setError('root', { message: 'Số điện thoại hoặc mật khẩu không đúng.' });
      } else if (err instanceof ApiError && err.status === 429) {
        setError('root', {
          message: 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại.',
        });
      } else {
        toast.error('Không đăng nhập được, thử lại sau.');
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field id="identifier" label="Email hoặc số điện thoại" autoComplete="username" placeholder="ban@example.com hoặc 0912345678" error={errors.identifier?.message} {...register('identifier')} />

      <div>
        <Field
          id="password"
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="mt-1.5 text-right">
          <Link
            href="/forgot-password"
            className="rounded-md text-sm text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </div>

      {errors.root && (
        <p
          role="alert"
          className="rounded-md bg-danger-50 p-3 text-sm text-danger-600"
        >
          {errors.root.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
