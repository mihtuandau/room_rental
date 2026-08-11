'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock3, Eye, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { ApiError } from '@/lib/api-client';
import { useIsSignedIn } from '@/stores/auth-store';
import { useRevealContact } from '@/features/rooms/hooks';
import type { RoomOwner } from '@/features/rooms/api';

function ZaloIcon() {
  return (
    <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-blue-600 text-[9px] font-bold leading-none text-white" aria-hidden>
      Za
    </span>
  );
}

export function RoomContactCard({
  roomId,
  roomSlug,
  price,
  deposit,
  listedAt,
  updatedAt,
  viewCount,
  isVerified,
  owner,
}: {
  roomId: number;
  roomSlug: string;
  price: number;
  deposit: number | null;
  listedAt: string;
  updatedAt: string;
  viewCount?: number;
  isVerified: boolean;
  owner: RoomOwner;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const revealContact = useRevealContact(roomId);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealedZalo, setRevealedZalo] = useState<string | null>(null);
  const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const memberFormatter = new Intl.DateTimeFormat('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const requireSignIn = () => {
    router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
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
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
          {owner.avatarUrl ? (
            <Image src={owner.avatarUrl} alt="" width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <UserRound className="h-6 w-6" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">{owner.fullName ?? 'Chủ trọ'}</p>
          <p className="text-xs text-zinc-500">Người đăng tin</p>
          <p className="mt-1 text-xs text-zinc-500">
            Tham gia từ {memberFormatter.format(new Date(owner.createdAt))}
          </p>
        </div>
        {isVerified && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700"
            title="Tin đã được quản trị viên xác minh"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Tin đã xác minh
          </span>
        )}
      </div>

      <div className="mt-5 border-t border-zinc-100 pt-4">
        <p className="text-2xl font-bold tabular-nums text-zinc-900">
          {formatPrice(price)}
          <span className="ml-1 text-base font-normal text-zinc-500">/tháng</span>
        </p>
        {deposit != null && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 text-sm">
            <span className="text-zinc-600">Đặt cọc</span>
            <span className="font-semibold text-zinc-900">{formatPrice(deposit)}</span>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2">
        {owner.contactPhoneMasked && !revealedPhone && (
          <div className="rounded-lg bg-zinc-50 px-3 py-2 text-center text-sm text-zinc-600">
            Số điện thoại: <span className="font-semibold text-zinc-800">{owner.contactPhoneMasked}</span>
          </div>
        )}
        {revealedPhone ? (
          <Button asChild className="w-full" size="lg">
            <a href={`tel:${revealedPhone}`}>
              <Phone className="h-4 w-4" aria-hidden />
              {revealedPhone}
            </a>
          </Button>
        ) : (
          <Button className="w-full" size="lg" onClick={() => handleReveal('phone')} disabled={revealContact.isPending}>
            <Phone className="h-4 w-4" aria-hidden />
            {revealContact.isPending ? 'Đang tải…' : isSignedIn ? 'Xem số điện thoại' : 'Đăng nhập để xem số'}
          </Button>
        )}
        {revealedZalo ? (
          <Button variant="outline" className="w-full" size="lg" asChild>
            <a href={revealedZalo} target="_blank" rel="noopener noreferrer"><ZaloIcon /> Mở Zalo</a>
          </Button>
        ) : (
          <Button variant="outline" className="w-full" size="lg" onClick={() => handleReveal('zalo')} disabled={revealContact.isPending}>
            <ZaloIcon /> Nhắn Zalo
          </Button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500">
        {viewCount != null && (
          <div className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
            <span>{viewCount.toLocaleString('vi-VN')} lượt xem</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
          <span>Đăng {dateFormatter.format(new Date(listedAt))}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock3 className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
          <span>Cập nhật {dateFormatter.format(new Date(updatedAt))}</span>
        </div>
      </div>

      <p className="mt-4 border-t border-zinc-100 pt-4 text-xs leading-5 text-zinc-500">
        Không chuyển khoản hoặc đặt cọc trước khi xem phòng và xác minh thông tin.
      </p>
    </div>
  );
}
