'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Field } from '@/features/auth/components/field';
import { useLogout } from '@/features/auth/hooks';
import { useProfile, useUpdateProfile } from '@/features/users/hooks';
import { updateProfileSchema, type UpdateProfileFormInput } from '@/features/users/schemas';
import { uploadToCloudinary } from '@/features/storage/api';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/constants';

const MEMBER_SINCE_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

export function AccountView() {
  const { data: profile, isPending, isError, refetch } = useProfile();

  if (isPending) return <AccountSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-8">
      <AvatarSection avatarUrl={profile.avatarUrl} fullName={profile.fullName} />

      <div className="space-y-1 rounded-2xl border border-zinc-200 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">Số điện thoại đăng nhập</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
            {profile.phone}
            {profile.isPhoneVerified && (
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-label="Đã xác minh" />
            )}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5">
          <span className="text-sm text-zinc-600">Thành viên từ</span>
          <span className="text-sm font-medium text-zinc-900">
            {new Date(profile.createdAt).toLocaleDateString('vi-VN', MEMBER_SINCE_FORMAT)}
          </span>
        </div>
      </div>

      <ProfileForm
        fullName={profile.fullName}
        contactPhone={profile.contactPhone}
        zaloUrl={profile.zaloUrl}
      />

      <LogoutButton />
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-16 w-full rounded-md" />
      </div>
    </div>
  );
}

function AvatarSection({
  avatarUrl,
  fullName,
}: {
  avatarUrl: string | null;
  fullName: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const updateProfile = useUpdateProfile();

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Ảnh vượt quá 5MB.');
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadToCloudinary(file, 'avatar');
      await updateProfile.mutateAsync({ avatarUrl: uploaded.secure_url });
    } catch {
      toast.error('Tải ảnh đại diện thất bại, thử lại nhé.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-400">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote host (Cloudinary), see upload-image-cloudinary skill
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-9 w-9" aria-hidden />
          )}
        </span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          aria-label="Đổi ảnh đại diện"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-card transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          <Camera className="h-4 w-4" aria-hidden />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
      <div>
        <p className="font-medium text-zinc-900">{fullName || 'Chưa đặt tên'}</p>
        <p className="text-sm text-zinc-500">{isUploading ? 'Đang tải ảnh lên…' : ' '}</p>
      </div>
    </div>
  );
}

function ProfileForm({
  fullName,
  contactPhone,
  zaloUrl,
}: {
  fullName: string | null;
  contactPhone: string | null;
  zaloUrl: string | null;
}) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: fullName ?? '',
      contactPhone: contactPhone ?? '',
      zaloUrl: zaloUrl ?? '',
    },
  });

  // Re-sync defaults if the cache updates from elsewhere (e.g. after the
  // avatar upload's mutation writes back the full profile).
  useEffect(() => {
    reset({
      fullName: fullName ?? '',
      contactPhone: contactPhone ?? '',
      zaloUrl: zaloUrl ?? '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync on server data changing, not on every `reset` identity change
  }, [fullName, contactPhone, zaloUrl]);

  const onSubmit = handleSubmit(async (values) => {
    await updateProfile.mutateAsync({
      fullName: values.fullName || undefined,
      contactPhone: values.contactPhone || undefined,
      zaloUrl: values.zaloUrl || undefined,
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        id="fullName"
        label="Họ và tên"
        autoComplete="name"
        placeholder="Nguyễn Văn A"
        error={errors.fullName?.message}
        {...register('fullName')}
      />

      <div>
        <Field
          id="contactPhone"
          label="Số điện thoại liên hệ"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0912345678"
          error={errors.contactPhone?.message}
          {...register('contactPhone')}
        />
        {!contactPhone && (
          <p className="mt-1 text-xs text-zinc-500">
            Cần có số điện thoại liên hệ trước khi bạn có thể đăng tin cho thuê.
          </p>
        )}
      </div>

      <Field
        id="zaloUrl"
        label="Đường dẫn Zalo"
        autoComplete="off"
        placeholder="https://zalo.me/0912345678"
        error={errors.zaloUrl?.message}
        {...register('zaloUrl')}
      />

      <Button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
      </Button>
    </form>
  );
}

function LogoutButton() {
  const router = useRouter();
  const logout = useLogout();

  return (
    <div className="border-t border-zinc-200 pt-6">
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await logout.mutateAsync();
          router.push('/');
          router.refresh();
        }}
        disabled={logout.isPending}
      >
        <LogOut className="h-4 w-4" aria-hidden />
        Đăng xuất
      </Button>
    </div>
  );
}
