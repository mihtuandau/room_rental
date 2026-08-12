'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, CheckCircle2, Phone, RotateCcw, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  useSendContactPhoneOtp,
  useVerifyContactPhoneOtp,
} from '@/features/auth/hooks';
import { ApiError } from '@/lib/api-client';
import { useUpdateProfile } from '@/features/users/hooks';
import {
  listingContactOtpSchema,
  listingContactSetupSchema,
  type ListingContactOtpInput,
  type ListingContactSetupInput,
} from '@/features/users/schemas';

type SetupStep = 'contact' | 'otp';

export function ListingContactSetup({
  initialPhone = '',
  verificationRequired = false,
  onComplete,
}: {
  initialPhone?: string;
  verificationRequired?: boolean;
  onComplete?: () => void;
}) {
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const sendOtp = useSendContactPhoneOtp();
  const verifyOtp = useVerifyContactPhoneOtp();
  const [step, setStep] = useState<SetupStep>('contact');
  const [phone, setPhone] = useState(initialPhone);
  const [otpError, setOtpError] = useState<string | null>(null);

  const contactForm = useForm<ListingContactSetupInput>({
    resolver: zodResolver(listingContactSetupSchema),
    defaultValues: { contactPhone: initialPhone },
  });
  const otpForm = useForm<ListingContactOtpInput>({
    resolver: zodResolver(listingContactOtpSchema),
    defaultValues: { code: '' },
  });

  const handleContactSubmit = contactForm.handleSubmit(async ({ contactPhone }) => {
    try {
      await updateProfile.mutateAsync({ contactPhone });
      setPhone(contactPhone);

      if (!verificationRequired) {
        onComplete?.();
        return;
      }

      await sendOtp.mutateAsync(contactPhone);
      setOtpError(null);
      setStep('otp');
    } catch {
      // Mutation hooks already provide the general toast. Keep the dialog open so
      // the user can correct the phone or retry without losing their context.
    }
  });

  const handleOtpSubmit = otpForm.handleSubmit(async ({ code }) => {
    try {
      await verifyOtp.mutateAsync({ phone, code });
      setOtpError(null);
      onComplete?.();
    } catch (error) {
      setOtpError(getOtpErrorMessage(error));
    }
  });

  const resendOtp = async () => {
    try {
      await sendOtp.mutateAsync(phone);
      setOtpError(null);
      otpForm.reset({ code: '' });
    } catch (error) {
      setOtpError(getOtpErrorMessage(error));
    }
  };

  const contactPending = contactForm.formState.isSubmitting || updateProfile.isPending || sendOtp.isPending;
  const otpPending = otpForm.formState.isSubmitting || verifyOtp.isPending;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.replace('/');
      }}
    >
      <DialogContent className="max-w-md" aria-describedby="listing-contact-description">
        <DialogHeader className="pr-12">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              {step === 'contact' ? (
                <Phone className="h-5 w-5" aria-hidden />
              ) : (
                <ShieldCheck className="h-5 w-5" aria-hidden />
              )}
            </span>
            <div>
              <p className="text-xs font-medium text-brand-700">
                Trước khi đăng tin
              </p>
              <DialogTitle className="mt-1">
                {step === 'contact'
                  ? 'Thêm số điện thoại liên hệ'
                  : 'Xác minh số điện thoại'}
              </DialogTitle>
              <p id="listing-contact-description" className="mt-1 text-sm leading-6 text-zinc-600">
                {step === 'contact'
                  ? 'Người thuê sẽ dùng số này để liên hệ với bạn sau khi tin đăng được duyệt.'
                  : `Nhập mã gồm 6 chữ số đã gửi đến ${phone}.`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {step === 'contact' ? (
          <form onSubmit={handleContactSubmit} noValidate>
            <DialogBody className="space-y-5">
              <div>
                <label
                  htmlFor="listingSetupContactPhone"
                  className="mb-1.5 block text-sm font-medium text-zinc-800"
                >
                  Số điện thoại liên hệ
                </label>
                <Input
                  id="listingSetupContactPhone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0912345678"
                  error={Boolean(contactForm.formState.errors.contactPhone)}
                  disabled={contactPending}
                  aria-describedby="listingSetupContactPhoneHelp"
                  {...contactForm.register('contactPhone')}
                />
                {contactForm.formState.errors.contactPhone ? (
                  <p className="mt-1.5 text-sm text-danger-600" role="alert">
                    {contactForm.formState.errors.contactPhone.message}
                  </p>
                ) : (
                  <p id="listingSetupContactPhoneHelp" className="mt-1.5 text-xs leading-5 text-zinc-500">
                    Bạn có thể thay đổi số này sau trong trang Tài khoản.
                  </p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-md bg-zinc-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" aria-hidden />
                  <p className="text-sm leading-6 text-zinc-600">
                  Tin đăng vẫn phải chờ admin duyệt trước khi hiển thị công khai.
                  {verificationRequired
                    ? ' Bạn cần xác minh số điện thoại trước khi tiếp tục.'
                    : ' Bạn có thể bắt đầu điền tin ngay sau khi lưu số.'}
                </p>
              </div>
            </DialogBody>
            <DialogFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={() => router.replace('/')}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Về trang tìm phòng
              </Button>
              <Button type="submit" disabled={contactPending}>
                {contactPending
                  ? verificationRequired
                    ? 'Đang gửi mã…'
                    : 'Đang lưu…'
                  : verificationRequired
                    ? 'Gửi mã xác minh'
                    : 'Lưu và tiếp tục'}
                {!contactPending ? <ArrowRight className="h-4 w-4" aria-hidden /> : null}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} noValidate>
            <DialogBody className="space-y-5">
              <div>
                <label htmlFor="listingSetupOtp" className="mb-1.5 block text-sm font-medium text-zinc-800">
                  Mã xác minh
                </label>
                <Input
                  id="listingSetupOtp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  error={Boolean(otpForm.formState.errors.code || otpError)}
                  disabled={otpPending}
                  {...otpForm.register('code', {
                    onChange: () => setOtpError(null),
                  })}
                />
                {otpForm.formState.errors.code || otpError ? (
                  <p className="mt-1.5 text-sm text-danger-600" role="alert">
                    {otpForm.formState.errors.code?.message ?? otpError}
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs leading-5 text-zinc-500">
                    Mã có hiệu lực trong thời gian giới hạn. Không chia sẻ mã này với người khác.
                  </p>
                )}
              </div>

              <button
                type="button"
                className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                onClick={() => void resendOtp()}
                disabled={sendOtp.isPending}
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {sendOtp.isPending ? 'Đang gửi lại…' : 'Gửi lại mã'}
              </button>
            </DialogBody>
            <DialogFooter className="justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOtpError(null);
                  setStep('contact');
                }}
              >
                Đổi số điện thoại
              </Button>
              <Button type="submit" disabled={otpPending}>
                {otpPending ? 'Đang xác minh…' : 'Xác minh và tiếp tục'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getOtpErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 429) {
    return 'Bạn thao tác hơi nhanh. Đợi một chút rồi thử lại.';
  }
  if (error instanceof ApiError && error.status === 400) {
    return 'Mã xác minh không đúng hoặc đã hết hạn. Kiểm tra lại hoặc gửi mã mới.';
  }
  return 'Không xác minh được số điện thoại. Kiểm tra kết nối và thử lại.';
}
