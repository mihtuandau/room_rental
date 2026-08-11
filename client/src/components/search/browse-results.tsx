'use client';

export function BrowseResults({
  browseTop,
  browseBottom,
}: {
  browseTop: React.ReactNode;
  browseBottom: React.ReactNode;
}) {
  return (
    <div
      id="search-results"
      className="mx-auto w-full max-w-7xl pb-14 pt-7 sm:pt-9 sm:pb-16"
    >
      <div className="flex flex-col gap-10 sm:gap-12">
        {browseTop}
        {browseBottom}
      </div>
    </div>
  );
}
