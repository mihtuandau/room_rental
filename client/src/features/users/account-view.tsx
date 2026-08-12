'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Check, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/states';
import { Field } from '@/features/auth/components/field';
import {
  useLogout,
  useSendContactPhoneOtp,
  useVerifyContactPhoneOtp,
} from '@/features/auth/hooks';
import { useProfile, useUpdateProfile } from '@/features/users/hooks';
import type { Profile } from '@/features/users/api';
import { updateProfileSchema, type UpdateProfileFormInput } from '@/features/users/schemas';
import { uploadToCloudinary } from '@/features/storage/api';
import { ApiError } from '@/lib/api-client';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/constants';

const MEMBER_SINCE_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

function getContactOtpErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return 'Không kết nối được máy chủ. Kiểm tra mạng và thử lại.';
  }

  switch (error.status) {
    case 400:
      return 'Số điện thoại vừa thay đổi. Hãy lưu hồ sơ rồi gửi lại mã.';
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.';
    case 409:
      return 'Số điện thoại này đang thuộc một tài khoản khác. Hãy dùng số khác hoặc đăng nhập đúng tài khoản.';
    case 429:
      return 'Bạn gửi mã hơi nhanh. Đợi một phút rồi thử lại.';
    case 503:
      return 'Dịch vụ SMS đang tạm gián đoạn. Hãy thử lại sau ít phút.';
    default:
      return 'Không gửi được mã xác minh. Hãy thử lại sau.';
  }
}

export function AccountView({ showLogout = true, showIdentity = true }: { showLogout?: boolean; showIdentity?: boolean }) {
  const { data: profile, isPending, isError, refetch } = useProfile();

  if (isPending) return <AccountSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      {showIdentity ? <AccountIdentityCard profile={profile} /> : null}

      <div className="space-y-4">
        <section className="w-full rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
          <div className="mb-5 border-b border-zinc-100 pb-4">
            <h2 className="font-semibold text-zinc-900">Thông tin cá nhân</h2>
            <p className="mt-1 text-sm text-zinc-600">Cập nhật thông tin để chủ trọ và người thuê dễ nhận diện bạn hơn.</p>
          </div>
          <div className="w-full">
            <ProfileForm
              email={profile.email}
              fullName={profile.fullName}
              contactPhone={profile.contactPhone}
              zaloUrl={profile.zaloUrl}
            />
          </div>
        </section>

        <div className="w-full">
          <ContactPhoneVerification
            key={`${profile.contactPhone ?? 'none'}-${profile.contactPhoneVerified}`}
            phone={profile.contactPhone}
            verified={profile.contactPhoneVerified}
          />
        </div>

        {showLogout ? <LogoutButton /> : null}
      </div>
    </div>
  );
}

export function AccountIdentityCard({ profile }: { profile: Profile }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <AvatarSection avatarUrl={profile.avatarUrl} fullName={profile.fullName} />
        <dl className="grid grid-cols-2 gap-5 border-t border-zinc-100 pt-4 text-sm sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
          <div>
            <dt className="text-xs text-zinc-500">Số đăng nhập</dt>
            <dd className="mt-1 flex items-center gap-1 font-medium text-zinc-900">
              {profile.phone}
              {profile.isPhoneVerified && <ShieldCheck className="h-4 w-4 text-brand-600" aria-label="Đã xác minh" />}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Thành viên từ</dt>
            <dd className="mt-1 font-medium text-zinc-900">
              {new Date(profile.createdAt).toLocaleDateString('vi-VN', MEMBER_SINCE_FORMAT)}
            </dd>
          </div>
        </dl>
      </div>
      <p className="mt-5 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500">
        Thông tin liên hệ chỉ hiển thị khi cần thiết cho tin đăng của bạn.
      </p>
    </section>
  );
}

function AccountSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-5 w-32" />
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
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
  email,
  fullName,
  contactPhone,
  zaloUrl,
}: {
  email: string | null;
  fullName: string | null;
  contactPhone: string | null;
  zaloUrl: string | null;
}) {
  const updateProfile = useUpdateProfile();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateProfileFormInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: fullName ?? '',
      contactPhone: contactPhone ?? '',
      zaloUrl: zaloUrl ?? '',
    },
  });
  const contactPhoneValue = useWatch({ control, name: 'contactPhone' });
  const zaloValue = useWatch({ control, name: 'zaloUrl' });
  const generatedZaloRef = useRef('');
  const initializedAutoFillRef = useRef(false);

  useEffect(() => {
    const normalizedPhone = (contactPhoneValue ?? '').replace(/\D/g, '');
    const generatedZalo = normalizedPhone
      ? `https://zalo.me/${normalizedPhone}`
      : '';
    const canAutoFill = !zaloValue || zaloValue === generatedZaloRef.current;

    if (canAutoFill && zaloValue !== generatedZalo) {
      setValue('zaloUrl', generatedZalo, {
        shouldDirty: initializedAutoFillRef.current,
        shouldValidate: initializedAutoFillRef.current,
      });
      generatedZaloRef.current = generatedZalo;
    }

    initializedAutoFillRef.current = true;
  }, [contactPhoneValue, setValue, zaloValue]);

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
      // `undefined` means "leave unchanged" to PATCH; `null` deliberately
      // clears an existing value in Prisma, which lets users remove stale
      // contact details rather than accidentally continuing to publish them.
      contactPhone: values.contactPhone || null,
      zaloUrl: values.zaloUrl || null,
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid w-full gap-4 sm:grid-cols-2" noValidate>
      <div>
        <label htmlFor="accountEmail" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Email đăng nhập
        </label>
        <div
          id="accountEmail"
          aria-describedby="accountEmailHelp"
          className="flex min-h-11 w-full items-center rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-700"
        >
          {email || 'Chưa thêm email'}
        </div>
        <p id="accountEmailHelp" className="mt-1 text-xs text-zinc-500">
          Email dùng để đăng nhập và khôi phục tài khoản.
        </p>
      </div>
      <div>
        <Field
          id="fullName"
          label="Họ và tên"
          autoComplete="name"
          placeholder="Nguyễn Văn A"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
      </div>

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

      <div>
        <Field
          id="zaloUrl"
          label="Đường dẫn Zalo"
          autoComplete="off"
          placeholder="https://zalo.me/0912345678"
          error={errors.zaloUrl?.message}
          {...register('zaloUrl')}
        />
      </div>

      <Button
        type="submit"
        className="w-fit sm:col-span-2"
        disabled={isSubmitting || !isDirty}
      >
        {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
      </Button>
    </form>
  );
}

function ContactPhoneVerification({
  phone,
  verified,
}: {
  phone: string | null;
  verified: boolean;
}) {
  const [step, setStep] = useState<'start' | 'verify'>('start');
  const [code, setCode] = useState('');
  const sendOtp = useSendContactPhoneOtp();
  const verifyOtp = useVerifyContactPhoneOtp();

  if (!phone) {
    return (
      <p className="rounded-md border border-dashed border-zinc-200 px-4 py-3 text-sm text-zinc-600">
        Thêm số điện thoại liên hệ và xác minh trước khi đăng tin.
      </p>
    );
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-800">
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        Số điện thoại liên hệ đã được xác minh.
      </div>
    );
  }

  const contactPhone = phone;

  async function requestOtp() {
    try {
      await sendOtp.mutateAsync(contactPhone);
      setStep('verify');
      setCode('');
      toast.success('Đã gửi mã xác minh đến số điện thoại liên hệ.');
    } catch (error) {
      toast.error(getContactOtpErrorMessage(error));
    }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) {
      toast.error('Mã xác minh gồm 6 chữ số.');
      return;
    }

    try {
      await verifyOtp.mutateAsync({ phone: contactPhone, code });
      toast.success('Đã xác minh số điện thoại liên hệ.');
    } catch {
      toast.error('Mã xác minh không đúng hoặc đã hết hạn.');
    }
  }

  return (
    <section className="rounded-xl border border-warning-100 bg-warning-50/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            Xác minh số điện thoại liên hệ
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {step === 'verify'
              ? `Nhập mã 6 chữ số đã gửi đến ${contactPhone}.`
              : 'Bạn cần xác minh để đăng tin và giúp người thuê liên hệ an toàn hơn.'}
          </p>
        </div>
        {step === 'start' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void requestOtp()}
            disabled={sendOtp.isPending}
          >
            {sendOtp.isPending ? 'Đang gửi mã…' : 'Gửi mã xác minh'}
          </Button>
        ) : null}
      </div>

      {step === 'verify' ? (
        <div className="mt-4 flex flex-col gap-3 border-t border-warning-100 pt-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="contactPhoneOtp"
              className="mb-1.5 block text-sm font-medium text-zinc-700"
            >
              Mã xác minh
            </label>
            <Input
              id="contactPhoneOtp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              placeholder="123456"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void requestOtp()}
              disabled={sendOtp.isPending || verifyOtp.isPending}
            >
              Gửi lại mã
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void verifyCode()}
              disabled={verifyOtp.isPending || code.length !== 6}
            >
              {verifyOtp.isPending ? 'Đang xác minh…' : 'Xác minh số điện thoại'}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
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
