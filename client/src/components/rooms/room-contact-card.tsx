'use client';

import Image from 'next/image';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Heart, MessageCircle, Phone, Share2, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';
import { useRevealContact } from '@/features/rooms/hooks';
import { useIsFavorited, useToggleFavorite } from '@/features/favorites/hooks';
import { useProfile } from '@/features/users/hooks';
import type { RoomOwner } from '@/features/rooms/api';
import { ReportDialog } from './report-dialog';
import { cn, formatPrice } from '@/lib/utils';

function isCloudinaryAvatar(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

export function RoomContactCard({
  roomId,
  roomSlug,
  isVerified,
  owner,
  price,
  deposit,
  embedded = false,
}: {
  roomId: number;
  roomSlug: string;
  isVerified: boolean;
  owner: RoomOwner;
  price?: number;
  deposit?: number | null;
  embedded?: boolean;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const revealContact = useRevealContact(roomId);
  const { isFavorited } = useIsFavorited(roomId);
  const toggleFavorite = useToggleFavorite(roomId);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealedZalo, setRevealedZalo] = useState<string | null>(null);
  const isOwnListing = Boolean(isSignedIn && profile?.id === owner.id);
  const ownPhone = isOwnListing ? profile?.contactPhone ?? profile?.phone ?? null : null;
  const ownZaloUrl = isOwnListing ? profile?.zaloUrl ?? null : null;
  const memberFormatter = new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const requireSignIn = () => {
    router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
  };

  const handleReveal = async (type: 'phone' | 'zalo') => {
    if (!isBootstrapped) return;
    if (!isSignedIn) return requireSignIn();
    if (isProfileLoading) return;
    if (isOwnListing) {
      if (type === 'phone' && ownPhone) setRevealedPhone(ownPhone);
      else if (type === 'zalo' && ownZaloUrl) setRevealedZalo(ownZaloUrl);
      else toast.error(type === 'phone'
        ? 'Hãy thêm và xác minh số liên hệ trong tài khoản.'
        : 'Bạn chưa thêm liên kết Zalo trong tài khoản.');
      return;
    }
    try {
      const result = await revealContact.mutateAsync(type);
      if (type === 'phone') {
        if (!result.contactPhone) {
          toast.error('Chủ trọ chưa cung cấp số điện thoại.');
          return;
        }
        setRevealedPhone(result.contactPhone);
      } else if (result.zaloUrl) {
        setRevealedZalo(result.zaloUrl);
      } else {
        toast.error('Chủ trọ chưa cung cấp liên kết Zalo.');
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) requireSignIn();
      else if (err instanceof ApiError && err.status === 403) {
        toast.error('Bạn đang xem tin của mình nên không cần mở số liên hệ.');
      } else {
        toast.error('Không tải được thông tin liên hệ, thử lại sau.');
      }
    }
  };

  const handleSave = () => {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
      return;
    }
    toggleFavorite.mutate(isFavorited);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết.');
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-surface-card',
        embedded
          ? 'rounded-xl border-0 shadow-none'
          : 'rounded-2xl border border-zinc-200/80 shadow-card',
      )}
    >
      {/* Price Header (if passed, shown on desktop card) */}
      {!embedded && price != null && (
        <div className="border-b border-zinc-100 p-5 sm:p-6 bg-zinc-50/50">
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading text-3xl font-bold tracking-tight text-brand-700 tabular-nums">
              {formatPrice(price)}
            </span>
            <span className="text-sm font-normal text-zinc-500">/tháng</span>
          </div>
          {deposit != null && (
            <p className="mt-1.5 text-xs text-zinc-500">
              Tiền đặt cọc: <span className="font-medium text-zinc-800">{formatPrice(deposit)}</span>
            </p>
          )}
        </div>
      )}

      {/* Host Profile Info */}
      <div className={cn('flex items-center gap-3.5 border-b border-zinc-100', embedded ? 'pb-4' : 'p-5 bg-zinc-50/50')}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-base font-semibold text-zinc-700 ring-1 ring-zinc-200">
          {isCloudinaryAvatar(owner.avatarUrl) ? (
            <Image src={owner.avatarUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            owner.fullName?.trim().charAt(0).toUpperCase() || <UserRound className="h-5 w-5 text-zinc-400" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-base font-semibold text-zinc-900">
            {owner.fullName ?? 'Chủ trọ'}
            {isVerified ? (
              <BadgeCheck className="h-4.5 w-4.5 shrink-0 fill-brand-700 text-white" aria-label="Đã xác minh" />
            ) : null}
          </p>
          <p className="text-xs text-zinc-500">
            Tham gia {memberFormatter.format(new Date(owner.createdAt))}
          </p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Chia sẻ tin đăng"
          className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <Share2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Action Buttons */}
      <div className={cn('space-y-3', embedded ? 'pt-4' : 'p-5')}>
        {owner.contactPhoneMasked && !revealedPhone && (
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-600 border border-zinc-100">
            SĐT: <span className="font-semibold text-zinc-800 tracking-wide">{owner.contactPhoneMasked}</span>
          </div>
        )}

        {revealedPhone || ownPhone ? (
          <Button asChild className="w-full font-semibold shadow-xs" size="lg">
            <a href={`tel:${revealedPhone ?? ownPhone}`}>
              <Phone className="h-4 w-4 mr-1.5" aria-hidden />
              {revealedPhone ?? ownPhone}
            </a>
          </Button>
        ) : isOwnListing ? (
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-xs text-zinc-600">
            Tin đăng của bạn
          </div>
        ) : (
          <Button
            className="w-full font-semibold shadow-xs"
            size="lg"
            onClick={() => handleReveal('phone')}
            disabled={!isBootstrapped || (isSignedIn && isProfileLoading) || revealContact.isPending}
          >
            <Phone className="h-4 w-4 mr-1.5" aria-hidden />
            {!isBootstrapped
              ? 'Đang kiểm tra phiên…'
              : revealContact.isPending
                ? 'Đang tải…'
                : isSignedIn
                  ? 'Xem số điện thoại'
                  : 'Đăng nhập để xem số'}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          {revealedZalo || ownZaloUrl ? (
            <Button variant="outline" className="w-full text-zinc-700" size="lg" asChild>
              <a href={revealedZalo ?? ownZaloUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-1 text-blue-600" aria-hidden /> Zalo
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-zinc-700"
              size="lg"
              onClick={() => handleReveal('zalo')}
              disabled={!isBootstrapped || (isSignedIn && isProfileLoading) || revealContact.isPending}
            >
              <MessageCircle className="h-4 w-4 mr-1 text-blue-600" aria-hidden /> Zalo
            </Button>
          )}

          <Button
            variant="outline"
            className={isFavorited ? 'w-full text-danger-600 border-danger-200 bg-danger-50 hover:bg-danger-100' : 'w-full text-zinc-700'}
            size="lg"
            onClick={handleSave}
            disabled={toggleFavorite.isPending}
            aria-pressed={isFavorited}
          >
            <Heart className={cn('h-4 w-4 mr-1', isFavorited ? 'fill-danger-600 text-danger-600' : 'text-zinc-500')} aria-hidden />
            {isFavorited ? 'Đã lưu' : 'Lưu tin'}
          </Button>
        </div>

        {/* Quiet reassurance note */}
        <p className="flex items-center justify-center gap-1 text-[11px] text-zinc-400 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
          <span>Kiểm tra phòng trực tiếp trước khi đặt cọc</span>
        </p>
      </div>

      <div className={cn('border-t border-zinc-100 text-center', embedded ? 'pt-3 pb-1' : 'px-4 py-2.5')}>
        <ReportDialog roomId={roomId} roomSlug={roomSlug} variant="link" />
      </div>
    </div>
  );
}

import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function RoomMobileContactBar({
  roomId,
  roomSlug,
  price,
  owner,
  isVerified,
}: {
  roomId: number;
  roomSlug: string;
  price: number;
  owner: RoomOwner;
  isVerified: boolean;
}) {
  const isSignedIn = useIsSignedIn();
  const router = useRouter();
  const { isFavorited } = useIsFavorited(roomId);
  const toggleFavorite = useToggleFavorite(roomId);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
      return;
    }
    toggleFavorite.mutate(isFavorited);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-zinc-200/90 bg-white/95 px-4 py-3 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] backdrop-blur-md lg:hidden pb-safe-bottom">
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        {/* Left: Price summary */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-zinc-500 leading-none">Giá thuê</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-heading text-lg font-bold text-brand-700 tabular-nums">
              {formatPrice(price)}
            </span>
            <span className="text-xs text-zinc-500">/tháng</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
            aria-label={isFavorited ? 'Bỏ lưu' : 'Lưu tin'}
            className={cn(
              'h-10 w-10 shrink-0 rounded-xl',
              isFavorited && 'text-danger-600 border-danger-200 bg-danger-50',
            )}
          >
            <Heart className={cn('h-4 w-4', isFavorited && 'fill-danger-600 text-danger-600')} />
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="h-10 px-4 sm:px-5 rounded-xl font-semibold shadow-xs bg-brand-700 hover:bg-brand-800 text-white active:scale-95"
              >
                <Phone className="h-4 w-4 mr-1.5" />
                Liên hệ chủ trọ
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-w-lg mx-auto">
              <SheetHeader className="text-left pb-2 pt-2 px-5">
                <SheetTitle className="font-heading text-lg font-bold text-zinc-900">
                  Thông tin liên hệ
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-500">
                  Liên hệ trực tiếp với người đăng tin để xem phòng
                </SheetDescription>
              </SheetHeader>
              <SheetBody className="px-5 pb-8 pt-1">
                <RoomContactCard
                  roomId={roomId}
                  roomSlug={roomSlug}
                  isVerified={isVerified}
                  owner={owner}
                  embedded
                />
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>,
    document.body,
  );
}
