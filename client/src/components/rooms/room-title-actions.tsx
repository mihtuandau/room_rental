'use client';

import { useRouter } from 'next/navigation';
import { Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsSignedIn } from '@/stores/auth-store';
import { useIsFavorited, useToggleFavorite } from '@/features/favorites/hooks';

export function RoomTitleActions({
  roomId,
  roomSlug,
}: {
  roomId: number;
  roomSlug: string;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const { isFavorited } = useIsFavorited(roomId);
  const toggleFavorite = useToggleFavorite(roomId);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      // The user's own explicit share action — not something we initiate.
      await navigator.share({ url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết.');
  };

  const handleSave = () => {
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
      return;
    }
    toggleFavorite.mutate(isFavorited);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={handleShare}
        aria-label="Chia sẻ tin đăng"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <Share2 className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={handleSave}
        disabled={toggleFavorite.isPending}
        aria-pressed={isFavorited}
        aria-label={isFavorited ? 'Bỏ lưu tin' : 'Lưu tin'}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <Heart
          className={cn('h-4 w-4', isFavorited && 'fill-danger-600 text-danger-600')}
          aria-hidden
        />
      </button>
    </div>
  );
}
