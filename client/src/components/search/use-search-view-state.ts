'use client';

import { useState } from 'react';
import { useQueryStates } from 'nuqs';
import { useRoomsSearch } from '@/features/rooms/hooks';
import {
  PAGE_SIZE,
  isSearchExpanded,
  searchParsers,
  toSearchParams,
  type SearchState,
} from '@/features/rooms/search-params';

export type ResultsView = 'list' | 'map';

const CLEARED: Partial<SearchState> = {
  keyword: '',
  city: '',
  district: '',
  ward: '',
  roomType: null,
  priceMin: null,
  priceMax: null,
  areaMin: null,
  areaMax: null,
  verifiedOnly: false,
  amenityIds: [],
  mode: 'area',
  lat: null,
  lng: null,
  radiusKm: null,
  page: 1,
};

function locationSuffix(state: SearchState) {
  if (state.ward && state.district && state.city)
    return ` tại ${state.ward}, ${state.district}, ${state.city}`;
  if (state.district && state.city) return ` tại ${state.district}, ${state.city}`;
  if (state.ward && state.city) return ` tại ${state.ward}, ${state.city}`;
  if (state.city) return ` tại ${state.city}`;
  return '';
}

export function useSearchViewState() {
  const [state, setState] = useQueryStates(searchParsers, {
    history: 'push',
    shallow: true,
  });
  const [view, setView] = useState<ResultsView>('list');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const query = useRoomsSearch(toSearchParams(state));

  function applyFilter(patch: Partial<SearchState>) {
    void setState({ ...patch, page: 1 });
  }

  function clearAll() {
    void setState(CLEARED);
  }

  const hasActiveFilters =
    Boolean(state.keyword) ||
    Boolean(state.city) ||
    Boolean(state.district) ||
    Boolean(state.ward) ||
    Boolean(state.roomType) ||
    state.mode === 'nearby' ||
    state.priceMin !== null ||
    state.priceMax !== null ||
    state.areaMin !== null ||
    state.areaMax !== null ||
    state.verifiedOnly ||
    state.amenityIds.length > 0;
  const dialogFilterCount =
    (state.roomType ? 1 : 0) +
    (state.priceMin !== null || state.priceMax !== null ? 1 : 0) +
    (state.areaMin !== null || state.areaMax !== null ? 1 : 0) +
    (state.verifiedOnly ? 1 : 0) +
    state.amenityIds.length;
  const filterResetKey = [
    state.priceMin,
    state.priceMax,
    state.areaMin,
    state.areaMax,
    state.verifiedOnly,
  ].join('|');
  const resultsHeading =
    state.mode === 'nearby'
      ? `Phòng gần vị trí của bạn${state.radiusKm ? ` · ${state.radiusKm} km` : ''}${locationSuffix(state)}`
      : state.ward
        ? `Phòng trọ tại ${state.ward}, ${state.district ? `${state.district}, ` : ''}${state.city}`
        : state.district
          ? `Phòng trọ tại ${state.district}, ${state.city}`
        : state.city
          ? `Phòng trọ tại ${state.city}`
          : hasActiveFilters
            ? 'Kết quả tìm phòng'
            : 'Tin đăng mới nhất';
  const rangeFrom = query.data
    ? (query.data.page - 1) * PAGE_SIZE + 1
    : 0;
  const rangeTo = query.data
    ? Math.min(query.data.page * PAGE_SIZE, query.data.total)
    : 0;

  return {
    state,
    query,
    view,
    setView,
    filtersOpen,
    setFiltersOpen,
    activeId,
    setActiveId,
    applyFilter,
    clearAll,
    goToPage: (page: number) => void setState({ page }),
    expanded: isSearchExpanded(state),
    expandToFullSearch: () => void setState({ all: true, page: 1 }),
    hasActiveFilters,
    dialogFilterCount,
    filterResetKey,
    resultsHeading,
    rangeFrom,
    rangeTo,
  };
}
