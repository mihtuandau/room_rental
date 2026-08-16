'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Clock, Eye, MapPin } from 'lucide-react';
import { RoomContactCard, RoomMobileContactBar } from '@/components/rooms/room-contact-card';
import { RoomGallery } from '@/components/rooms/room-gallery';
import { RoomLocationMap } from '@/components/rooms/room-location-map';
import { RoomViewTracker } from '@/components/rooms/room-view-tracker';
import { ReportDialog } from '@/components/rooms/report-dialog';
import type { RoomDetail } from '@/features/rooms/api';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { RoomAmenities, RoomFacts } from './room-detail-sections';
import { RoomGrid, type RoomCardItem } from '@/components/rooms/room-card';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function RoomDetailContent({
  room,
  similarRooms = [],
  recommendedRooms = [],
}: {
  room: RoomDetail;
  similarRooms?: RoomCardItem[];
  recommendedRooms?: RoomCardItem[];
}) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [room.slug]);

  const displayAddress = Array.from(
    new Set(
      [room.address, room.ward, room.district, room.city].filter(
        (part): part is string => Boolean(part),
      ),
    ),
  ).join(', ');

  const featuredRooms = recommendedRooms.slice(0, 3);
  const featuredIds = new Set(featuredRooms.map((item) => item.id));
  const relatedRooms = [...similarRooms, ...recommendedRooms.slice(3)]
    .filter((item) => !featuredIds.has(item.id))
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.id === item.id) === index,
    )
    .slice(0, 4);

  const sidebarSimilarRooms = (similarRooms.length > 0 ? similarRooms : recommendedRooms)
    .filter((item) => item.id !== room.id)
    .slice(0, 3);

  return (
    <div className="pb-28 lg:pb-16 max-w-7xl mx-auto">
      <RoomViewTracker room={room} />

      {/* Top Breadcrumb Bar */}
      <div className="pt-1 pb-3">
        <Breadcrumb
          items={[
            { label: room.city, href: `/?city=${encodeURIComponent(room.city)}&all=true` },
            ...(room.district
              ? [
                  {
                    label: room.district,
                    href: `/?city=${encodeURIComponent(room.city)}&district=${encodeURIComponent(room.district)}&all=true`,
                  },
                ]
              : []),
            { label: room.title },
          ]}
        />
      </div>

      {/* Main Grid: Left Column (Gallery + Info + Content) | Right Column (Sticky Contact Card starting alongside gallery) */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        {/* Left Column */}
        <div className="min-w-0 space-y-7">
          {/* Gallery (at the top of left column, level with contact card) */}
          <RoomGallery
            title={room.title}
            images={room.images}
            isVerified={room.isVerified}
          />

          {/* Header Block: Badges, Metadata, Title, Address, Price */}
          <div className="space-y-3.5">
            {/* Top Row: Badges & Publish Date/Views */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                  {ROOM_TYPE_LABELS[room.roomType]}
                </span>
                {room.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200/60">
                    <BadgeCheck className="h-3.5 w-3.5 fill-brand-700 text-white" aria-hidden />
                    Đã kiểm duyệt
                  </span>
                )}
              </div>

              {/* Timestamp & Views */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-400">
                {room.createdAt && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                    Đăng ngày {new Date(room.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                )}
                {room.viewCount != null && room.viewCount > 0 && (
                  <>
                    <span className="text-zinc-200">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-zinc-400" aria-hidden />
                      {room.viewCount.toLocaleString('vi-VN')} lượt xem
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Main Title */}
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 leading-snug">
              {room.title}
            </h1>

            {/* Address */}
            <p className="flex items-start gap-1.5 text-sm text-zinc-600">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-zinc-400" aria-hidden />
              <span>{displayAddress}</span>
            </p>

            {/* Price Highlight */}
            <div className="flex items-baseline gap-1 pt-0.5">
              <span className="font-heading text-2xl sm:text-3xl font-bold text-brand-700 tabular-nums">
                {formatPrice(room.price)}
              </span>
              <span className="text-sm font-medium text-zinc-500">/tháng</span>
            </div>
          </div>

          {/* Key Facts Strip */}
          <RoomFacts room={room} />

          {/* Description */}
          {room.description && (
            <section className="space-y-3">
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Thông tin mô tả
              </h2>
              <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-zinc-700">
                {room.description}
              </p>
            </section>
          )}

          {/* Amenities */}
          <RoomAmenities room={room} />

          {/* Location Map */}
          <div className="border-t border-zinc-200/80 pt-7">
            <RoomLocationMap
              address={room.address}
              ward={room.ward}
              district={room.district}
              city={room.city}
              latitude={room.latitude}
              longitude={room.longitude}
            />
          </div>

          {/* Mobile Report Trigger */}
          <div className="lg:hidden text-center pt-2">
            <ReportDialog roomId={room.id} roomSlug={room.slug} variant="link" />
          </div>
        </div>

        {/* Right Column: Sticky Contact Card & Similar Rooms alongside gallery and throughout entire page scroll */}
        <aside className="hidden lg:sticky lg:top-20 lg:block space-y-5">
          <RoomContactCard
            roomId={room.id}
            roomSlug={room.slug}
            isVerified={room.isVerified}
            owner={room.owner}
          />

          {/* Similar Rooms Widget in Sidebar */}
          {sidebarSimilarRooms.length > 0 && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm font-bold text-zinc-900">
                  Phòng tương tự tại {room.city}
                </h3>
                <Link
                  href={`/?city=${encodeURIComponent(room.city)}&all=true`}
                  className="text-xs font-medium text-brand-700 hover:text-brand-800 transition-colors"
                >
                  Xem thêm →
                </Link>
              </div>

              <div className="space-y-3 divide-y divide-zinc-100">
                {sidebarSimilarRooms.map((item) => {
                  const coverImage = item.images[0]?.url || '/room1.jpg';
                  return (
                    <Link
                      key={item.id}
                      href={`/room/${item.slug}`}
                      className="group flex items-center gap-3 pt-3 first:pt-0"
                    >
                      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-zinc-100">
                        <Image
                          src={coverImage}
                          alt={item.title}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-semibold text-zinc-800 group-hover:text-brand-700 transition-colors leading-snug">
                          {item.title}
                        </p>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-xs font-bold text-brand-700 tabular-nums">
                            {formatPrice(item.price)}
                          </span>
                          <span className="text-[10px] text-zinc-400">/tháng</span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-zinc-400">
                          {item.area ? `${item.area} m² · ` : ''}
                          {item.district || item.city}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Single Unified Bottom Similar Rooms Section */}
      {relatedRooms.length > 0 && (
        <section className="mt-14 border-t border-zinc-200/80 pt-9">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-zinc-900">
                Tin đăng tương tự tại {room.city}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-zinc-500">
                Lựa chọn cùng khu vực dành cho bạn
              </p>
            </div>
            <Link
              href={`/?city=${encodeURIComponent(room.city)}&roomType=${room.roomType}&all=true`}
              className="hidden sm:inline-flex text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors"
            >
              Xem tất cả phòng &rarr;
            </Link>
          </div>
          <RoomGrid rooms={relatedRooms} className="lg:grid-cols-4" />
        </section>
      )}

      {/* Mobile Sticky Contact Bar */}
      <RoomMobileContactBar
        roomId={room.id}
        roomSlug={room.slug}
        price={room.price}
        owner={room.owner}
        isVerified={room.isVerified}
      />
    </div>
  );
}
