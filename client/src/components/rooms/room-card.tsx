'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BedDouble, Heart, MapPin, Ruler } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/badge';
import { ROOM_TYPE_LABELS, type RoomType } from '@/lib/constants';
import { cn, formatPrice } from '@/lib/utils';
import { useIsSignedIn } from '@/stores/auth-store';
import { useIsFavorited, useToggleFavorite } from '@/features/favorites/hooks';

/**
 * The subset of a listing a card needs. Once `types/api.d.ts` is generated from
 * the backend's OpenAPI spec this should narrow that type instead of standing
 * on its own.
 */
export interface RoomCardItem {
  id: number;
  title: string;
  slug: string;
  price: number;
  area: number | null;
  bedrooms: number | null;
  city: string;
  district: string;
  roomType: RoomType;
  isVerified: boolean;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  images: { url: string }[];
}

export const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300?text=Tro+Oi';
const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // "Mới": posted within the last 3 days

export function RoomCard({
  room,
  active = false,
  onActivate,
  onDeactivate,
}: {
  room: RoomCardItem;
  /** Highlighted because its map marker is hovered (or vice-versa). */
  active?: boolean;
  onActivate?: () => void;
  onDeactivate?: () => void;
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const { isFavorited } = useIsFavorited(room.id);
  const toggleFavorite = useToggleFavorite(room.id);

  // Date.now() is impure — confine it to a lazy initializer (evaluated once
  // per mount) instead of calling it directly during render, so the badge
  // can't flip between the server render and hydration.
  const [now] = useState(() => Date.now());
  const isNew = now - new Date(room.createdAt).getTime() < NEW_WINDOW_MS;

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault(); // this button sits over the card's stretched link
    if (!isSignedIn) {
      router.push(`/login?next=${encodeURIComponent('/')}`);
      return;
    }
    toggleFavorite.mutate(isFavorited);
  };

  return (
    <article
      id={`room-${room.id}`}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-white transition-shadow',
        active ? 'border-brand-600 shadow-card' : 'border-zinc-200 hover:shadow-card',
      )}
    >
      <div className="relative aspect-[4/3]">
        {/* eslint-disable-next-line @next/next/no-img-element -- swap to next/image once remote hosts are configured */}
        <img
          src={room.images[0]?.url ?? PLACEHOLDER_IMAGE}
          alt={room.title}
          className="h-full w-full object-cover"
        />

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {room.isVerified && <VerifiedBadge />}
          {isNew && (
            <span className="rounded-full bg-zinc-900/80 px-2 py-0.5 text-xs font-medium text-white">
              Mới
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={toggleFavorite.isPending}
          aria-pressed={isFavorited}
          aria-label={isFavorited ? 'Bỏ lưu tin' : 'Lưu tin'}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow-card transition-colors hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          <Heart
            className={cn('h-4 w-4', isFavorited && 'fill-danger-600 text-danger-600')}
            aria-hidden
          />
        </button>

        <span className="absolute bottom-2 left-2 rounded-full bg-brand-600 px-2.5 py-1 text-sm font-semibold text-white">
          {formatPrice(room.price)}
        </span>
      </div>

      <div className="space-y-1.5 p-3">
        <h3 className="line-clamp-1 text-sm font-medium">{room.title}</h3>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          {ROOM_TYPE_LABELS[room.roomType]} · {room.district}, {room.city}
        </p>
        {(room.bedrooms !== null || room.area !== null) && (
          <div className="flex items-center gap-3 pt-0.5 text-xs text-zinc-500">
            {room.bedrooms !== null && (
              <span className="flex items-center gap-1">
                <BedDouble className="h-3.5 w-3.5" aria-hidden />
                {room.bedrooms}
              </span>
            )}
            {room.area !== null && (
              <span className="flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" aria-hidden />
                {room.area} m²
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stretched link: the whole card is clickable, but sits below the save
          button (z-20) in stacking order so that button stays independently
          clickable — avoids nesting an interactive button inside an anchor. */}
      <Link
        href={`/room/${room.slug}`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        <span className="sr-only">{room.title}</span>
      </Link>
    </article>
  );
}

export function RoomGrid({
  rooms,
  activeId = null,
  onActivate,
  className,
}: {
  rooms: RoomCardItem[];
  /** The room whose card should be highlighted (synced with the map). */
  activeId?: number | null;
  onActivate?: (id: number | null) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          active={activeId === room.id}
          onActivate={onActivate ? () => onActivate(room.id) : undefined}
          onDeactivate={onActivate ? () => onActivate(null) : undefined}
        />
      ))}
    </div>
  );
}
