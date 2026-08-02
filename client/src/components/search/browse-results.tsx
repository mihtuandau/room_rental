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
      id="ket-qua"
      className="mx-auto w-full max-w-7xl space-y-12 pb-8 pt-0 sm:space-y-16"
    >
      {browseTop}
      {browseBottom}
    </div>
  );
}
