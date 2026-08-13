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
      className="mx-auto w-full max-w-7xl pb-16 pt-8 sm:pb-20 sm:pt-10"
    >
      <div className="flex flex-col gap-16 sm:gap-20">
        {browseTop}
        {browseBottom}
      </div>
    </div>
  );
}
