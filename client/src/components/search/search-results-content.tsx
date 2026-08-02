'use client';

import dynamic from 'next/dynamic';
import { RoomGrid } from '@/components/rooms/room-card';
import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import type { RoomSearchResult } from '@/features/rooms/api';
import { PAGE_SIZE, type SearchState } from '@/features/rooms/search-params';
import { cn } from '@/lib/utils';
import { SearchPagination } from './search-pagination';
import type { ResultsView } from './use-search-view-state';

const ResultsMap = dynamic(
  () => import('./results-map').then((module) => module.ResultsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-lg bg-zinc-100" />
    ),
  },
);

export function SearchResultsContent({
  data,
  view,
  activeId,
  hasActiveFilters,
  isPending,
  isError,
  isPlaceholderData,
  state,
  onActivate,
  onPage,
  onClear,
  onRetry,
}: {
  data?: RoomSearchResult;
  view: ResultsView;
  activeId: number | null;
  hasActiveFilters: boolean;
  isPending: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  state: SearchState;
  onActivate: (roomId: number | null) => void;
  onPage: (page: number) => void;
  onClear: () => void;
  onRetry: () => void;
}) {
  if (isPending) return <RoomGridSkeleton count={PAGE_SIZE} />;
  if (isError || !data) return <ErrorState onRetry={onRetry} />;
  if (!data.rooms.length) {
    return hasActiveFilters ? (
      <EmptyState
        title="Không tìm thấy phòng phù hợp"
        description="Thử nới lỏng bộ lọc để xem nhiều tin hơn."
        action={{ label: 'Xoá bộ lọc', onClick: onClear }}
      />
    ) : (
      <EmptyState
        title="Chưa có tin đăng nào"
        description="Hãy là người đầu tiên đăng tin cho thuê."
        action={{ label: 'Đăng tin', href: '/manage/listings/new' }}
      />
    );
  }
  if (view === 'map') {
    return (
      <ResultsMap
        rooms={data.rooms}
        state={state}
        activeId={activeId}
        onActivate={onActivate}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          'transition-opacity',
          isPlaceholderData && 'pointer-events-none opacity-60',
        )}
      >
        <RoomGrid
          rooms={data.rooms}
          activeId={activeId}
          onActivate={onActivate}
          className="sm:grid-cols-2 lg:grid-cols-3"
        />
      </div>
      <SearchPagination
        page={data.page}
        total={data.total}
        onPage={onPage}
      />
    </>
  );
}
