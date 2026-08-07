import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { RoomCard } from '@/components/rooms/room-card';
import type { RoomSearchResult } from '@/features/rooms/api';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

async function getFeaturedListings() {
  return serverFetch<RoomSearchResult>('/rooms?pageSize=3', {
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
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Tin đăng dành cho <span className="text-brand-700">bạn</span>
          </h2>
          <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
            Không gian sống chất lượng từ chủ trọ đã xác minh, cập nhật liên tục.
          </p>
        </div>

        <Link
          href="/?all=true&sort=newest"
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-xs transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        >
          Xem tất cả
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </ScrollReveal>

      {/* 3-column grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room, i) => (
          <ScrollReveal key={room.id} delay={i * 150}>
            <RoomCard room={room} priority={i === 0} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
