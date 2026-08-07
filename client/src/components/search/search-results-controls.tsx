'use client';

import { LayoutGrid, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Amenity } from '@/features/amenities/api';
import type { SearchState } from '@/features/rooms/search-params';
import { SORT_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ActiveFilters } from './active-filters';
import { FilterPanel } from './filter-panel';
import type { ResultsView } from './use-search-view-state';

type ApplyFilter = (patch: Partial<SearchState>) => void;

export function SearchResultsControls({
  state,
  amenities,
  heading,
  total,
  rangeFrom,
  rangeTo,
  filtersOpen,
  dialogFilterCount,
  filterResetKey,
  view,
  onFiltersOpenChange,
  onViewChange,
  onChange,
  onClear,
}: {
  state: SearchState;
  amenities: Amenity[];
  heading: string;
  total?: number;
  rangeFrom: number;
  rangeTo: number;
  filtersOpen: boolean;
  dialogFilterCount: number;
  filterResetKey: string;
  view: ResultsView;
  onFiltersOpenChange: (open: boolean) => void;
  onViewChange: (view: ResultsView) => void;
  onChange: ApplyFilter;
  onClear: () => void;
}) {


  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
          <p className="mt-1 text-sm text-zinc-500" aria-live="polite" role="status">
            {total === undefined
              ? 'Đang tải…'
              : total === 0
                ? '0 tin đăng'
                : `Hiển thị ${rangeFrom}–${rangeTo} trong ${total.toLocaleString('vi-VN')} tin đăng`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MobileFilters
            open={filtersOpen}
            count={dialogFilterCount}
            resetKey={filterResetKey}
            state={state}
            amenities={amenities}
            onOpenChange={onFiltersOpenChange}
            onChange={onChange}
            onClear={onClear}
          />
          <Select
            value={state.sort}
            onValueChange={(sort) =>
              onChange({ sort: sort as SearchState['sort'] })
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
            className="flex h-10 items-center rounded-md border border-zinc-200 p-0.5"
          >
            <ViewTab
              active={view === 'list'}
              onClick={() => onViewChange('list')}
              label="Danh sách"
            >
              <LayoutGrid className="h-4 w-4" aria-hidden />
            </ViewTab>
            <ViewTab
              active={view === 'map'}
              onClick={() => onViewChange('map')}
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
          onChange={onChange}
          onClear={onClear}
        />
      </div>
    </>
  );
}

function MobileFilters({
  open,
  count,
  resetKey,
  state,
  amenities,
  onOpenChange,
  onChange,
  onClear,
}: {
  open: boolean;
  count: number;
  resetKey: string;
  state: SearchState;
  amenities: Amenity[];
  onOpenChange: (open: boolean) => void;
  onChange: ApplyFilter;
  onClear: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Bộ lọc
          {count > 0 ? (
            <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-medium text-white">
              {count}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <SheetTitle>Bộ lọc tìm kiếm</SheetTitle>
        </SheetHeader>
        <SheetBody>
          <FilterPanel
            key={resetKey}
            state={state}
            amenities={amenities}
            onChange={onChange}
            onClear={onClear}
          />
        </SheetBody>
        <div className="border-t border-zinc-200 bg-white p-4">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Xem kết quả
          </Button>
        </div>
      </SheetContent>
    </Sheet>
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
        'inline-flex h-9 items-center gap-1.5 rounded px-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
        active
          ? 'bg-brand-50 font-medium text-brand-700'
          : 'text-zinc-600 hover:bg-zinc-50',
      )}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
