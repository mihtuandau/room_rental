'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn, formatPrice } from '@/lib/utils';
import { ApiError } from '@/lib/api-client';
import { useIsSignedIn } from '@/stores/auth-store';
import { useRevealContact } from '@/features/rooms/hooks';
import type { RoomOwner } from '@/features/rooms/api';

/** Zalo doesn't ship a lucide icon; a compact wordmark badge reads clearly enough. */
function ZaloIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded bg-[#0068ff] text-[10px] font-bold leading-none text-white',
        className,
      )}
      aria-hidden
    >
      Za
    </span>
  );
}

export function RoomContactCard({
  roomId,
  price,
  deposit,
  isVerified,
  owner,
}: {
  roomId: number;
  price: number;
  deposit: number | null;
  isVerified: boolean;
  owner: RoomOwner;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const revealContact = useRevealContact(roomId);

  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealedZalo, setRevealedZalo] = useState<string | null>(null);

  const requireSignIn = () => {
    router.push(`/login?next=${encodeURIComponent(`/room/${roomId}`)}`);
  };

  const handleReveal = async (type: 'phone' | 'zalo') => {
    if (!isSignedIn) return requireSignIn();
    try {
      const result = await revealContact.mutateAsync(type);
      if (type === 'phone') setRevealedPhone(result.contactPhone);
      else setRevealedZalo(result.zaloUrl);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) requireSignIn();
      else toast.error('Không tải được thông tin liên hệ, thử lại sau.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Price stays zinc-900 per design-system — it's information, not an
          action, so it doesn't borrow the brand accent even though the
          reference design uses it there. */}
      <div className="space-y-4 rounded-2xl border border-zinc-200 p-5 shadow-card">
        <p className="text-2xl font-bold text-zinc-900">
          {formatPrice(price)}
          <span className="text-base font-normal text-zinc-500">/tháng</span>
        </p>

        {deposit != null && (
          <div className="flex items-center justify-between border-y border-zinc-100 py-2 text-sm">
            <span className="text-zinc-600">Đặt cọc</span>
            <span className="font-semibold text-zinc-900">{formatPrice(deposit)}</span>
          </div>
        )}

        <div className="space-y-2">
          {revealedPhone ? (
            <Button asChild className="w-full" size="lg">
              <a href={`tel:${revealedPhone}`}>
                <Phone className="h-4 w-4" aria-hidden />
                {revealedPhone}
              </a>
            </Button>
          ) : (
            <Button
              className="w-full"
              size="lg"
              onClick={() => handleReveal('phone')}
              disabled={revealContact.isPending}
            >
              <Phone className="h-4 w-4" aria-hidden />
              {revealContact.isPending ? 'Đang tải…' : 'Xem số điện thoại'}
            </Button>
          )}

          {revealedZalo ? (
            <Button variant="outline" className="w-full" size="lg" asChild>
              <a href={revealedZalo} target="_blank" rel="noopener noreferrer">
                <ZaloIcon className="h-4 w-4" />
                Mở Zalo
              </a>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={() => handleReveal('zalo')}
              disabled={revealContact.isPending}
            >
              <ZaloIcon className="h-4 w-4" />
              Nhắn Zalo
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
          {owner.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- swap to next/image once remote hosts are configured
            <img src={owner.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-6 w-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{owner.fullName ?? 'Chủ trọ'}</p>
          <p className="text-xs text-zinc-500">Người đăng tin</p>
        </div>
      </div>

      {/* Only claim what's actually true: the listing went through admin
          moderation. No fabricated "secure payment/contract" system — RoomRent
          doesn't have one in this MVP. */}
      {isVerified && (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand-700" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-brand-900">Tin đăng đã xác minh</p>
            <p className="mt-0.5 text-xs text-brand-700">
              Tin này đã qua kiểm duyệt của RoomRent trước khi hiển thị.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
