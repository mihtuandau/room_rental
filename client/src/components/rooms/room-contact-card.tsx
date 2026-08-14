'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Heart, MessageCircle, Phone, Share2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api-client';
import { useAuthStore, useIsSignedIn } from '@/stores/auth-store';
import { useRevealContact } from '@/features/rooms/hooks';
import { useIsFavorited, useToggleFavorite } from '@/features/favorites/hooks';
import { useProfile } from '@/features/users/hooks';
import type { RoomOwner } from '@/features/rooms/api';
import { ReportDialog } from './report-dialog';
import { cn } from '@/lib/utils';

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
  embedded = false,
}: {
  roomId: number;
  roomSlug: string;
  isVerified: boolean;
  owner: RoomOwner;
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
    // The access token is restored from the httpOnly refresh cookie on mount.
    // Do not treat the short window before that request settles as a guest
    // session, otherwise a signed-in user gets redirected to /login by a fast
    // click on the contact button.
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
    <div className={cn(
      'relative overflow-hidden bg-surface-card',
      embedded
        ? 'rounded-xl border-0 shadow-none'
        : 'rounded-xl border border-border-subtle shadow-card lg:rounded-2xl',
    )}>
      <div className="relative flex items-center gap-3 border-b border-border-subtle p-4 pr-14 sm:p-5 sm:pr-14">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-800 text-lg font-medium text-white sm:h-14 sm:w-14">
          {isCloudinaryAvatar(owner.avatarUrl) ? (
            <Image src={owner.avatarUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            owner.fullName?.trim().charAt(0).toUpperCase() || <UserRound className="h-6 w-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-base font-semibold text-zinc-900 sm:text-lg">
            {owner.fullName ?? 'Chủ trọ'}
            {isVerified ? <BadgeCheck className="h-5 w-5 shrink-0 fill-brand-700 text-white" aria-label="Đã xác minh" /> : null}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Tham gia từ {memberFormatter.format(new Date(owner.createdAt))}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Chia sẻ tin đăng"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:right-5 sm:top-5"
      >
        <Share2 className="h-4 w-4" aria-hidden />
      </button>

      <div className="space-y-2.5 p-4 sm:p-5">
        {owner.contactPhoneMasked && !revealedPhone && (
          <div className="rounded-lg bg-surface-subtle px-3 py-2 text-center text-sm text-zinc-600">
            Số điện thoại: <span className="font-semibold text-zinc-800">{owner.contactPhoneMasked}</span>
          </div>
        )}
        {revealedPhone || ownPhone ? (
          <Button asChild className="w-full" size="lg">
            <a href={`tel:${revealedPhone ?? ownPhone}`}>
              <Phone className="h-4 w-4" aria-hidden />
              {revealedPhone ?? ownPhone}
            </a>
          </Button>
        ) : isOwnListing ? (
          <div className="rounded-lg bg-surface-subtle px-3 py-2 text-center text-sm text-zinc-600">
            Hãy thêm và xác minh số liên hệ trong tài khoản để hiển thị số điện thoại.
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={() => handleReveal('phone')}
            disabled={!isBootstrapped || (isSignedIn && isProfileLoading) || revealContact.isPending}
          >
            <Phone className="h-4 w-4" aria-hidden />
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
            <Button variant="outline" className="w-full" size="lg" asChild>
              <a href={revealedZalo ?? ownZaloUrl ?? '#'} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" aria-hidden /> Zalo</a>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleReveal('zalo')}
              disabled={!isBootstrapped || (isSignedIn && isProfileLoading) || revealContact.isPending}
            >
              <MessageCircle className="h-4 w-4" aria-hidden /> Zalo
            </Button>
          )}
          <Button
            variant="outline"
            className={isFavorited ? 'w-full bg-zinc-100 text-danger-600' : 'w-full'}
            size="lg"
            onClick={handleSave}
            disabled={toggleFavorite.isPending}
            aria-pressed={isFavorited}
          >
            <Heart className={isFavorited ? 'h-4 w-4 fill-current' : 'h-4 w-4'} aria-hidden />
            {isFavorited ? 'Đã lưu' : 'Lưu tin'}
          </Button>
        </div>
      </div>

      <div className="border-t border-border-subtle px-4 py-3 text-center sm:px-5">
        <ReportDialog roomId={roomId} roomSlug={roomSlug} variant="link" />
      </div>

    </div>
  );
}
