'use client';

import dynamic from 'next/dynamic';

// MapLibre only runs in the browser and is heavy, so it's client-only and
// code-split. `ssr: false` requires a Client Component boundary — this tiny
// wrapper file is that boundary, so the server-rendered address/button text
// around it in RoomLocationMap stays SEO-visible.
export const RoomMapLazy = dynamic(
  () => import('./room-map').then((m) => m.RoomMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full animate-pulse rounded-2xl bg-zinc-100" />
    ),
  },
);
