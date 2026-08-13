'use client';

import dynamic from 'next/dynamic';
import { RoomGrid } from '@/components/rooms/room-card';
import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { EmptyState, ErrorState } from '@/components/ui/states';
import type { RoomSearchResult } from '@/features/rooms/api';
import { PAGE_SIZE, type SearchState } from '@/features/rooms/search-params';
import { cn } from '@/lib/utils';
import { SearchPagination } from './search-pagination';
import { hasSavedSearchCriteria, SaveSearchButton } from './save-search-button';
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

function SearchResultsSkeleton({ view }: { view: ResultsView }) {
  if (view === 'map') {
    return (
      <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-lg border border-zinc-200 bg-zinc-100" />
    );
  }

  return <RoomGridSkeleton count={PAGE_SIZE} />;
}

export function SearchResultsContent({
  data,
  view,
  activeId,
  hasActiveFilters,
  isPending,
  isFetching,
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
  isFetching: boolean;
  isError: boolean;
  isPlaceholderData: boolean;
  state: SearchState;
  onActivate: (roomId: number | null) => void;
  onPage: (page: number) => void;
  onClear: () => void;
  onRetry: () => void;
}) {
  // Show a layout-matching skeleton during the first client fetch after a
  // reload as well as when no cached result exists. Keep previous results
  // visible for pagination/filter transitions via `isPlaceholderData`.
  if (isPending || (isFetching && !isPlaceholderData)) {
    return <SearchResultsSkeleton view={view} />;
  }
  if (isError || !data) return <ErrorState onRetry={onRetry} />;
  if (!data.rooms.length) {
    if (hasActiveFilters) {
      return (
        <div className="space-y-3">
          <EmptyState
            title="Không tìm thấy phòng phù hợp"
            description="Thử nới lỏng bộ lọc hoặc lưu tìm kiếm để nhận tin mới phù hợp."
            action={{ label: 'Xoá bộ lọc', onClick: onClear }}
          />
          {hasSavedSearchCriteria(state) ? (
            <div className="flex justify-center">
              <SaveSearchButton state={state} />
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <EmptyState
        title="Chưa có tin đăng phù hợp"
        description="Bạn có thể tìm theo khu vực khác hoặc quay lại trang tìm phòng để bắt đầu lại."
        action={{ label: 'Tìm theo khu vực', href: '/#tim-phong' }}
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
