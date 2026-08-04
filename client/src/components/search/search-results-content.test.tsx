import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchResultsContent } from './search-results-content';

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="results-map" />,
}));

describe('SearchResultsContent', () => {
  it('shows a grid skeleton during the initial request', () => {
    const { container } = render(
      <SearchResultsContent
        data={undefined}
        view="list"
        activeId={null}
        hasActiveFilters={false}
        isPending
        isFetching
        isError={false}
        isPlaceholderData={false}
        state={{} as never}
        onActivate={vi.fn()}
        onPage={vi.fn()}
        onClear={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders the map view when results are available', () => {
    render(
      <SearchResultsContent
        data={{ rooms: [{ id: 1 }] as never[], total: 1, page: 1, pageSize: 12 }}
        view="map"
        activeId={null}
        hasActiveFilters={false}
        isPending={false}
        isFetching={false}
        isError={false}
        isPlaceholderData={false}
        state={{} as never}
        onActivate={vi.fn()}
        onPage={vi.fn()}
        onClear={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(document.querySelector('[data-testid="results-map"]')).toBeInTheDocument();
  });
});
