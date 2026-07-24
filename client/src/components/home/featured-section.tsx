import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { VerifiedBadge } from '@/components/ui/badge';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import type { RoomCardItem } from '@/components/rooms/room-card';
import type { RoomSearchResult } from '@/features/rooms/api';

const PLACEHOLDER_IMAGE = 'https://placehold.co/800x600?text=RoomRent';

// "Nổi bật" has no curation flag of its own — verified-first is already the
// backend's default ranking, so the highest-priced verified listings stand in
// as the featured set without inventing new state.
async function getFeatured() {
  return serverFetch<RoomSearchResult>('/rooms?sort=price_desc&pageSize=3', {
    revalidate: 3600,
  }).catch(() => null);
}

export async function FeaturedSection() {
  const data = await getFeatured();
  const [hero, ...rest] = data?.rooms ?? [];
  if (!hero) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Lựa chọn hàng đầu
          </p>
          <h2 className="mt-1 text-lg font-semibold">Căn hộ nổi bật</h2>
        </div>
        <p className="max-w-sm text-sm text-zinc-600 sm:text-right">
          Những không gian sống được đánh giá cao nhất về vị trí và dịch vụ.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HeroCard room={hero} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {rest.map((room) => (
            <MiniCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroCard({ room }: { room: RoomCardItem }) {
  return (
    <Link
      href={`/room/${room.slug}`}
      className="group relative block aspect-[4/3] overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 lg:aspect-auto lg:h-full lg:min-h-[320px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- swap to next/image once remote hosts are configured */}
      <img
        src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
        alt={room.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      {room.isVerified && <VerifiedBadge className="absolute left-3 top-3" />}

      <div className="absolute inset-x-0 bottom-0 space-y-1 p-4 text-white">
        <h3 className="text-lg font-semibold">{room.title}</h3>
        <p className="flex items-center gap-1 text-sm text-white/85">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {room.district}, {room.city}
        </p>
        <p className="pt-1 text-xl font-bold">{formatPrice(room.price)}/tháng</p>
      </div>
    </Link>
  );
}

function MiniCard({ room }: { room: RoomCardItem }) {
  return (
    <Link
      href={`/room/${room.slug}`}
      className="group block overflow-hidden rounded-lg border border-zinc-200 transition-shadow hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
    >
      <div className="aspect-[16/9] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- swap to next/image once remote hosts are configured */}
        <img
          src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
          alt={room.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-0.5 p-3">
        <p className="text-base font-semibold">{formatPrice(room.price)}/tháng</p>
        <p className="text-xs text-zinc-500">
          {ROOM_TYPE_LABELS[room.roomType]} · {room.district}, {room.city}
        </p>
      </div>
    </Link>
  );
}
