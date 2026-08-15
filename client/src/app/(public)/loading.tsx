 'use client';

import { useSearchParams } from 'next/navigation';
import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

const SEARCH_PARAM_KEYS = [
  'all',
  'keyword',
  'city',
  'provinceCode',
  'district',
  'ward',
  'wardCode',
  'roomType',
  'priceMin',
  'priceMax',
  'areaMin',
  'areaMax',
  'verifiedOnly',
  'amenityIds',
  'mode',
  'lat',
  'lng',
  'radiusKm',
  'page',
] as const;

export default function PublicLoading() {
  const searchParams = useSearchParams();

  if (SEARCH_PARAM_KEYS.some((key) => searchParams.has(key))) {
    return <SearchLoading />;
  }

  return <HomeLoading />;
}

function HomeLoading() {
  return (
    <div className="min-h-[70vh] bg-surface-page" aria-busy="true" aria-label="Đang tải trang">
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-page via-brand-50/20 to-surface-page pb-10 pt-8 sm:pb-14 sm:pt-12">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:min-h-[500px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-12 lg:px-8">
          <div className="space-y-5">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full max-w-md rounded-lg sm:h-12" />
              <Skeleton className="h-10 w-4/5 max-w-sm rounded-lg sm:h-12" />
              <Skeleton className="h-5 w-full max-w-lg" />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-2 h-4 w-72 max-w-full" />
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg" />
                <Skeleton className="h-11 w-full rounded-lg sm:w-28" />
              </div>
            </div>
          </div>
          <Skeleton className="h-56 w-full rounded-2xl sm:h-72 lg:h-[430px]" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-5 w-80 max-w-full" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full rounded-lg sm:h-36" />
          ))}
        </div>
      </section>
    </div>
  );
}

function SearchLoading() {
  return (
    <div className="min-h-[70vh] bg-surface-page" aria-busy="true" aria-label="Đang tải kết quả tìm kiếm">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Skeleton className="h-12 w-full rounded-xl" />

        <div className="mt-5 lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
          <aside className="hidden lg:block">
            <Skeleton className="h-[620px] w-full rounded-lg" />
          </aside>

          <div className="min-w-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-7 w-56" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-28" />
                <Skeleton className="h-10 w-36" />
              </div>
            </div>
            <Skeleton className="mt-3 h-7 w-48" />
            <div className="mt-6">
              <RoomGridSkeleton count={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
