export default function RoomDetailLoading() {
  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <div className="pb-24 lg:pb-6">
          {/* Back button & Actions skeleton */}
          <div className="flex items-center justify-between gap-4">
            <div className="h-9 w-24 animate-pulse rounded-md bg-zinc-200" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-zinc-200" />
            </div>
          </div>

          {/* Header skeleton */}
          <header className="mb-5 mt-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-zinc-200 sm:w-1/2" />
            <div className="mt-3 flex items-center gap-3">
              <div className="h-6 w-24 animate-pulse rounded-full bg-zinc-200" />
              <div className="h-5 w-64 animate-pulse rounded-md bg-zinc-200" />
            </div>
          </header>

          {/* Gallery Skeleton: Mobile Aspect-Video + Desktop Bento Grid (8 cols / 2 rows) */}
          <div className="md:hidden">
            <div className="relative aspect-video w-full animate-pulse rounded-lg bg-zinc-200" />
          </div>
          <div className="hidden h-room-gallery grid-cols-8 grid-rows-2 gap-3 overflow-hidden rounded-lg md:grid">
            <div className="col-span-6 row-span-2 h-full w-full animate-pulse bg-zinc-200" />
            <div className="col-span-2 h-full w-full animate-pulse bg-zinc-200" />
            <div className="col-span-2 h-full w-full animate-pulse bg-zinc-200" />
          </div>

          {/* Main content & Sidebar layout */}
          <div className="mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
            <div className="space-y-6">
              {/* Room Facts Skeleton (5 circular icons + labels) */}
              <section className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-3 sm:p-5 md:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 text-center">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200" />
                    <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
                  </div>
                ))}
              </section>

              {/* Room Amenities Skeleton */}
              <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
                <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-7 w-28 animate-pulse rounded-full bg-zinc-200" />
                  ))}
                </div>
              </section>

              {/* Description Skeleton */}
              <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
                <div className="h-6 w-20 animate-pulse rounded bg-zinc-200" />
                <div className="mt-4 space-y-2.5">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
                  <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-200" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-zinc-200" />
                </div>
              </section>

              {/* Map Skeleton */}
              <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
                <div className="h-5 w-40 animate-pulse rounded bg-zinc-200" />
                <div className="mt-4 h-[300px] w-full animate-pulse rounded-md bg-zinc-200" />
              </section>
            </div>

            {/* Sidebar Contact Card Skeleton */}
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-5 lg:sticky lg:top-20 lg:mt-0">
              <div className="flex items-baseline justify-between">
                <div className="h-8 w-32 animate-pulse rounded bg-zinc-200" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-200" />
              </div>
              <div className="mt-2 h-4 w-24 animate-pulse rounded bg-zinc-200" />

              <div className="mt-6 space-y-3">
                <div className="h-11 w-full animate-pulse rounded-lg bg-zinc-200" />
                <div className="h-11 w-full animate-pulse rounded-lg bg-zinc-200" />
              </div>

              {/* Owner Info Skeleton */}
              <div className="mt-6 flex items-center gap-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-zinc-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
