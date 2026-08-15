import { Skeleton } from '@/components/ui/skeleton';

export default function RoomDetailLoading() {
  return (
    <div className="bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="pb-28 lg:pb-6">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-24" />
          </div>

          <div className="mt-4 sm:mt-6 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(280px,3fr)] lg:items-start lg:gap-8">
            <div className="min-w-0 space-y-8">
              <div className="aspect-[4/3] w-full animate-pulse rounded-xl bg-zinc-200 sm:aspect-[16/9] lg:aspect-[16/8]" />

              <section className="border-b border-zinc-200 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-7 w-24 rounded-full" />
                  <Skeleton className="h-7 w-28 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-9 w-11/12 rounded-lg sm:h-10 sm:w-3/4" />
                <Skeleton className="mt-3 h-5 w-full max-w-xl rounded" />
                <Skeleton className="mt-4 h-9 w-40 rounded-lg" />
              </section>

              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="min-h-28 rounded-xl border border-zinc-200 bg-white p-4">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <Skeleton className="mt-3 h-5 w-16" />
                    <Skeleton className="mt-2 h-4 w-20" />
                  </div>
                ))}
              </section>

              <section className="border-t border-zinc-200 pt-6">
                <Skeleton className="h-6 w-24" />
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="border-t border-zinc-200 pt-7">
                <Skeleton className="h-6 w-20" />
                <div className="mt-3 space-y-2.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </section>

              <section className="border-t border-zinc-200 pt-7">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="mt-4 h-[300px] w-full rounded-xl" />
              </section>
            </div>

            <aside className="mt-8 hidden lg:sticky lg:top-24 lg:block lg:mt-0">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-zinc-200 p-5">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="space-y-2.5 p-5">
                  <Skeleton className="h-12 w-full rounded-lg" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-12 w-full rounded-none" />
              </div>
            </aside>
          </div>

          <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-3 border-t border-zinc-200 bg-white px-3 py-3 shadow-lg lg:hidden sm:px-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-11 w-36 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
