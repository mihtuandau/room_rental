'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useQueryStates } from 'nuqs';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Map as MapIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState, ErrorState } from '@/components/ui/states';
import { RoomGrid } from '@/components/rooms/room-card';
import { RoomGridSkeleton } from '@/components/rooms/room-card-skeleton';
import { SORT_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import { useRoomsSearch } from '@/features/rooms/hooks';
import {
  PAGE_SIZE,
  isSearchExpanded,
  searchParsers,
  toSearchParams,
  type SearchState,
} from '@/features/rooms/search-params';
import { LatestListingsCarousel } from '@/components/home/latest-listings-carousel';
import { FilterPanel } from './filter-panel';
import { ActiveFilters } from './active-filters';
import { SearchToolbar } from './search-toolbar';

// MapLibre only runs in the browser and is heavy, so load it client-side only,
// and only once the user actually switches to the map view.
const ResultsMap = dynamic(
  () => import('./results-map').then((m) => m.ResultsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] min-h-[420px] w-full animate-pulse rounded-lg bg-zinc-100" />
    ),
  },
);

type ResultsView = 'list' | 'map';

const CLEARED: Partial<SearchState> = {
  keyword: '',
  city: '',
  ward: '',
  roomType: null,
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  verifiedOnly: false,
  amenityIds: [],
  page: 1,
};

export function SearchView({
  amenities,
  provinces,
  browseTop,
  browseBottom,
}: {
  amenities: Amenity[];
  provinces: ProvinceOption[];
  /**
   * Server-rendered content for browse/landing mode (categories, featured
   * pick, landlord CTA). Passed in as children from the Server Component
   * parent (page.tsx) rather than imported here — this file is a Client
   * Component, and those sections use `server-only` data fetching that
   * cannot be bundled into client code.
   */
  browseTop: React.ReactNode;
  browseBottom: React.ReactNode;
}) {
  const [state, setState] = useQueryStates(searchParsers, {
    history: 'push',
    shallow: true,
  });
  const [view, setView] = useState<ResultsView>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Room highlighted across the list ⇄ map (whichever is hovered).
  const [activeId, setActiveId] = useState<number | null>(null);

  const filters = toSearchParams(state);
  const { data, isPending, isError, isPlaceholderData, refetch } =
    useRoomsSearch(filters);

  // Any filter change resets to page 1 — otherwise a narrower filter can strand
  // the user on an empty page 5.
  const applyFilter = (patch: Partial<SearchState>) =>
    setState({ ...patch, page: 1 });
  const clearAll = () => setState(CLEARED);
  const goToPage = (page: number) => setState({ page });

  const hasActiveFilters =
    !!state.keyword ||
    !!state.city ||
    !!state.ward ||
    !!state.roomType ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.areaMin !== null ||
    state.areaMax !== null ||
    state.verifiedOnly ||
    state.amenityIds.length > 0;

  // Count only what lives inside the filter panel (keyword/city/ward come
  // from the toolbar above), so the mobile dialog's badge matches what it opens.
  const dialogFilterCount =
    (state.roomType ? 1 : 0) +
    (state.priceMin !== null || state.priceMax !== null ? 1 : 0) +
    (state.areaMin !== null || state.areaMax !== null ? 1 : 0) +
    (state.verifiedOnly ? 1 : 0) +
    state.amenityIds.length;

  // Remount the panel when the committed filters change from outside (e.g.
  // Clear), so its local slider state re-initialises without a sync effect.
  const filterResetKey = `${state.priceMin}|${state.priceMax}|${state.areaMin}|${state.areaMax}|${state.verifiedOnly}`;

  // "Phòng trọ tại Quận 7, Hồ Chí Minh" when we know a place, otherwise a
  // generic heading matching whether any filter is actually narrowing results.
  const resultsHeading = state.ward
    ? `Phòng trọ tại ${state.ward}, ${state.city}`
    : state.city
      ? `Phòng trọ tại ${state.city}`
      : hasActiveFilters
        ? 'Kết quả tìm phòng'
        : 'Tin đăng mới nhất';

  const rangeFrom = data ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const rangeTo = data ? Math.min(data.page * PAGE_SIZE, data.total) : 0;

  // Whether to show the full toolbar/filters/map (vs. the curated landing
  // view) — `state.all` covers "Xem tất cả" with zero filters chosen; real
  // filters expand it regardless. Driven purely by URL state (not local
  // component state) so the sibling HomeHero can read the exact same signal
  // and hide its own floating search card once this is true.
  const expanded = isSearchExpanded(state);
  const expandToFullSearch = () => setState({ all: true, page: 1 });

  if (!expanded) {
    // Landing/browse mode: the hero above already owns the one search action
    // (province/type/price). This is a curated browse experience, not another
    // search surface — categories, a featured pick, and the newest listings.
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
                Cập nhật những căn phòng vừa mới lên sóng.
              </p>
            </div>
            <button
              type="button"
              onClick={expandToFullSearch}
              className="hidden shrink-0 rounded-md text-sm text-brand-700 transition-colors hover:text-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:block"
            >
              Xem tất cả
            </button>
          </div>

          <div className="mt-4">
            {isPending ? (
              <RoomGridSkeleton count={4} />
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : data.rooms.length === 0 ? (
              <EmptyState
                title="Chưa có tin đăng nào"
                description="Hãy là người đầu tiên đăng tin cho thuê."
                action={{ label: 'Đăng tin', href: '/manage/listings/new' }}
              />
            ) : (
              <LatestListingsCarousel rooms={data.rooms} />
            )}
          </div>

          <div className="mt-4 flex justify-center sm:hidden">
            <Button variant="outline" onClick={expandToFullSearch}>
              Xem tất cả tin đăng
            </Button>
          </div>
        </section>

        {browseBottom}
      </div>
    );
  }

  return (
    <div id="ket-qua" className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* The one search surface: province → ward → keyword, always visible. */}
      <SearchToolbar state={state} provinces={provinces} onChange={applyFilter} />

      <div className="mt-6 lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
        {/* Desktop: filters as a persistent sidebar. Mobile gets a dialog
            instead (see the "Bộ lọc" trigger below) — a fixed 320px column
            doesn't fit a phone screen. */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border border-zinc-200 bg-white p-5 shadow-card">
            <FilterPanel
              key={filterResetKey}
              state={state}
              amenities={amenities}
              onChange={applyFilter}
              onClear={clearAll}
            />
          </div>
        </aside>

        <div className="mt-6 lg:mt-0">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {/* h1 here — HomeHero (which normally owns the page's h1)
                  renders nothing once expanded, so this is it. */}
              <h1 className="text-xl font-semibold tracking-tight">
                {resultsHeading}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                {data
                  ? data.total === 0
                    ? '0 tin đăng'
                    : `Hiển thị ${rangeFrom}–${rangeTo} trong ${data.total.toLocaleString('vi-VN')} tin đăng`
                  : 'Đang tải…'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile-only: the sidebar above is lg:hidden, so filters live
                  in a dialog here instead. */}
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" aria-hidden />
                    Bộ lọc
                    {dialogFilterCount > 0 && (
                      <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-medium text-white">
                        {dialogFilterCount}
                      </span>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Bộ lọc</DialogTitle>
                  </DialogHeader>
                  <DialogBody>
                    <FilterPanel
                      key={filterResetKey}
                      state={state}
                      amenities={amenities}
                      onChange={applyFilter}
                      onClear={clearAll}
                    />
                  </DialogBody>
                  <DialogFooter>
                    <Button onClick={() => setFiltersOpen(false)}>Xem kết quả</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Select
                value={state.sort}
                onValueChange={(sort) =>
                  applyFilter({ sort: sort as SearchState['sort'] })
                }
              >
                <SelectTrigger className="w-[168px]" aria-label="Sắp xếp">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div
                role="tablist"
                aria-label="Kiểu hiển thị"
                className="flex h-9 items-center rounded-md border border-zinc-200 p-0.5"
              >
                <ViewTab
                  active={view === 'list'}
                  onClick={() => setView('list')}
                  label="Danh sách"
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                </ViewTab>
                <ViewTab
                  active={view === 'map'}
                  onClick={() => setView('map')}
                  label="Bản đồ"
                >
                  <MapIcon className="h-4 w-4" aria-hidden />
                </ViewTab>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <ActiveFilters
              state={state}
              amenities={amenities}
              onChange={applyFilter}
              onClear={clearAll}
            />
          </div>

          <div className="mt-6">
            {isPending ? (
              <RoomGridSkeleton count={PAGE_SIZE} />
            ) : isError ? (
              <ErrorState onRetry={() => refetch()} />
            ) : data.rooms.length === 0 ? (
              hasActiveFilters ? (
                <EmptyState
                  title="Không tìm thấy phòng phù hợp"
                  description="Thử nới lỏng bộ lọc để xem nhiều tin hơn."
                  action={{ label: 'Xoá bộ lọc', onClick: clearAll }}
                />
              ) : (
                <EmptyState
                  title="Chưa có tin đăng nào"
                  description="Hãy là người đầu tiên đăng tin cho thuê."
                  action={{ label: 'Đăng tin', href: '/manage/listings/new' }}
                />
              )
            ) : view === 'map' ? (
              <ResultsMap rooms={data.rooms} activeId={activeId} onActivate={setActiveId} />
            ) : (
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
                    onActivate={setActiveId}
                    className="sm:grid-cols-2 lg:grid-cols-3"
                  />
                </div>
                <Pagination page={data.page} total={data.total} onPage={goToPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      title={label}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        active ? 'bg-brand-50 font-medium text-brand-700' : 'text-zinc-600 hover:bg-zinc-50',
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  // A small window of pages around the current one, always including 1 and last.
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const visible = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav
      aria-label="Phân trang"
      className="mt-8 flex items-center justify-center gap-1.5"
    >
      <PageButton
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </PageButton>

      {visible.map((p, i) => {
        const prev = visible[i - 1];
        const gap = prev !== undefined && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-sm text-zinc-400">…</span>}
            <PageButton current={p === page} onClick={() => onPage(p)}>
              {p}
            </PageButton>
          </span>
        );
      })}

      <PageButton
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </PageButton>
    </nav>
  );
}

function PageButton({
  current,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { current?: boolean }) {
  return (
    <button
      type="button"
      aria-current={current ? 'page' : undefined}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-md border text-sm tabular-nums transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-40',
        current
          ? 'border-brand-600 bg-brand-600 font-medium text-white'
          : 'border-zinc-200 bg-white hover:bg-zinc-50',
        className,
      )}
      {...props}
    />
  );
}
