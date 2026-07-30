'use client';

import { Button } from '@/components/ui/button';
import { LatestListingsCarousel } from '@/components/home/latest-listings-carousel';
import type { RoomCardItem } from '@/components/rooms/room-card';
import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';

export function BrowseResults({
  browseTop,
  browseBottom,
  rooms,
  isPending,
  isError,
  onRetry,
  onExpand,
}: {
  browseTop: React.ReactNode;
  browseBottom: React.ReactNode;
  rooms?: RoomCardItem[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onExpand: () => void;
}) {
  return (
    <div
      id="ket-qua"
      className="mx-auto w-full max-w-7xl space-y-12 pb-8 pt-8 sm:space-y-16 sm:pt-12"
    >
      {browseTop}
      <section id="tin-moi" className="scroll-mt-20 px-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Tin đăng mới nhất</h2>
            <p className="text-sm text-zinc-500">
              Cập nhật những phòng vừa được đăng.
            </p>
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="hidden shrink-0 rounded-md text-sm text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:block"
          >
            Xem tất cả
          </button>
        </div>
        <div className="mt-4">
          {isPending ? (
            <RoomGridSkeleton count={4} />
          ) : isError ? (
            <ErrorState onRetry={onRetry} />
          ) : !rooms?.length ? (
            <EmptyState
              title="Chưa có tin đăng nào"
              description="Hãy là người đầu tiên đăng tin cho thuê."
              action={{ label: 'Đăng tin', href: '/manage/listings/new' }}
            />
          ) : (
            <LatestListingsCarousel rooms={rooms} />
          )}
        </div>
        <div className="mt-4 flex justify-center sm:hidden">
          <Button variant="outline" onClick={onExpand}>
            Xem tất cả tin đăng
          </Button>
        </div>
      </section>
      {browseBottom}
    </div>
  );
}
