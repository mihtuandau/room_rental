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
      className="mx-auto w-full max-w-7xl pb-16 pt-7 sm:pt-10 sm:pb-20"
    >
      <div className="flex flex-col gap-12 sm:gap-16">
        {browseTop}
        {browseBottom}
      </div>
    </div>
  );
}
