'use client';

import type { Amenity } from '@/features/amenities/api';
import type { ProvinceOption } from '@/features/locations/api';
import { BrowseResults } from './browse-results';
import { FilterPanel } from './filter-panel';
import { SearchResultsContent } from './search-results-content';
import { SearchResultsControls } from './search-results-controls';
import { SearchToolbar } from './search-toolbar';
import { useSearchViewState } from './use-search-view-state';

export function SearchView({
  amenities,
  provinces,
  browseTop,
  browseBottom,
}: {
  amenities: Amenity[];
  provinces: ProvinceOption[];
  browseTop: React.ReactNode;
  browseBottom: React.ReactNode;
}) {
  const search = useSearchViewState();
  const { query } = search;

  if (!search.expanded) {
    return (
      <BrowseResults
        browseTop={browseTop}
        browseBottom={browseBottom}
      />
    );
  }

  return (
    <div id="search-results" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <SearchToolbar
        state={search.state}
        provinces={provinces}
        onChange={search.applyFilter}
      />
      <div className="mt-5 lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-lg border border-border-subtle bg-surface-card p-5 shadow-card">
            <FilterPanel
              key={search.filterResetKey}
              state={search.state}
              amenities={amenities}
              onChange={search.applyFilter}
              onClear={search.clearAll}
            />
          </div>
        </aside>
        <div className="mt-5 lg:mt-0">
          <SearchResultsControls
            state={search.state}
            amenities={amenities}
            heading={search.resultsHeading}
            total={query.data?.total}
            rangeFrom={search.rangeFrom}
            rangeTo={search.rangeTo}
            filtersOpen={search.filtersOpen}
            dialogFilterCount={search.dialogFilterCount}
            filterResetKey={search.filterResetKey}
            view={search.view}
            onFiltersOpenChange={search.setFiltersOpen}
            onViewChange={search.setView}
            onChange={search.applyFilter}
            onClear={search.clearAll}
          />
          <div className="mt-6">
            <SearchResultsContent
              data={query.data}
              view={search.view}
              activeId={search.activeId}
              hasActiveFilters={search.hasActiveFilters}
              isPending={query.isPending}
              isFetching={query.isFetching}
              isError={query.isError}
              isPlaceholderData={query.isPlaceholderData}
              state={search.state}
              onActivate={search.setActiveId}
              onPage={search.goToPage}
              onClear={search.clearAll}
              onRetry={() => void query.refetch()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
