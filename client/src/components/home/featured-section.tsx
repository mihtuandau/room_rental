import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { RoomCard } from '@/components/rooms/room-card';
import type { RoomSearchResult } from '@/features/rooms/api';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

async function getFeaturedListings() {
  return serverFetch<RoomSearchResult>('/rooms?sort=newest&pageSize=3', {
    revalidate: 60,
  }).catch(() => null);
}

export async function FeaturedSection() {
  const data = await getFeaturedListings();
  const rooms = data?.rooms ?? [];
  if (!rooms.length) return null;

  return (
    <section
      id="tin-moi"
      className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 sm:px-6"
    >
      {/* Header */}
      <ScrollReveal className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="hidden">
            ✦ Mới nhất &amp; nổi bật
          </span>
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Tin mới được <span className="text-brand-700">kiểm duyệt</span>
          </h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-500">
            Những tin đăng mới nhất đã qua kiểm duyệt, cập nhật liên tục mỗi ngày.
          </p>
        </div>

        <Link
          href="/?all=true&sort=newest"
          className="group self-start sm:self-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-zinc-700 shadow-xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Xem tất cả
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </ScrollReveal>

      {/* 3-column grid */}
      <div className="mt-6 -mx-4 flex gap-4 snap-x snap-mandatory overflow-x-auto px-4 pb-4 sm:mx-0 sm:mt-7 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-[1.12fr_0.94fr_0.94fr] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {rooms.map((room, i) => (
          <ScrollReveal 
            key={room.id} 
            delay={i * 150}
            className="w-[92vw] shrink-0 snap-center sm:w-auto"
          >
            <RoomCard room={room} priority={i === 0} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
