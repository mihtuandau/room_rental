'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { BackButton } from '@/components/ui/back-button';
import { ReportDialog } from '@/components/rooms/report-dialog';
import { RoomContactCard } from '@/components/rooms/room-contact-card';
import { RoomGallery } from '@/components/rooms/room-gallery';
import { RoomLocationMap } from '@/components/rooms/room-location-map';
import { RoomTitleActions } from '@/components/rooms/room-title-actions';
import { RoomViewTracker } from '@/components/rooms/room-view-tracker';
import type { RoomDetail } from '@/features/rooms/api';
import { ROOM_TYPE_LABELS } from '@/lib/constants';
import { formatPrice } from '@/lib/utils';
import { RoomAmenities, RoomFacts } from './room-detail-sections';
import { RoomGrid, type RoomCardItem } from '@/components/rooms/room-card';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function RoomDetailContent({
  room,
  similarRooms = [],
  recommendedRooms = [],
}: {
  room: RoomDetail;
  similarRooms?: RoomCardItem[];
  recommendedRooms?: RoomCardItem[];
}) {
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  const displayAddress = Array.from(
    new Set(
      [room.address, room.ward, room.district, room.city].filter(
        (part): part is string => Boolean(part),
      ),
    ),
  ).join(', ');

  // Keep the recommendation hierarchy useful without repeating the same room
  // in multiple sections. Featured rooms stay in the sidebar; the lower grid
  // combines nearby/type matches and remaining city recommendations uniquely.
  const featuredRooms = recommendedRooms.slice(0, 3);
  const featuredIds = new Set(featuredRooms.map((item) => item.id));
  const relatedRooms = [...similarRooms, ...recommendedRooms.slice(3)]
    .filter((item) => !featuredIds.has(item.id))
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.id === item.id) === index,
    )
    .slice(0, 4);

  return (
    <div className="pb-24 lg:pb-6">
      <RoomViewTracker room={room} />
      <div className="flex items-center justify-between gap-4">
        <BackButton />
      </div>
      <header className="mb-4 mt-2 flex items-start justify-between gap-4 sm:mt-3">
        <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {room.title}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            {ROOM_TYPE_LABELS[room.roomType]}
          </span>
          <p className="flex items-start gap-2 text-sm text-zinc-600">
            <MapPin
              className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
              aria-hidden
            />
            {displayAddress}
          </p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-900 lg:hidden">
          {formatPrice(room.price)}/tháng
        </p>
        </div>
        <div className="pt-0.5">
          <RoomTitleActions roomId={room.id} roomSlug={room.slug} />
        </div>
      </header>
      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <RoomGallery
          title={room.title}
          images={room.images}
          isVerified={room.isVerified}
        />
        <div className="mt-6 lg:sticky lg:top-20 lg:mt-4">
          <RoomContactCard
            roomId={room.id}
            roomSlug={room.slug}
            price={room.price}
            deposit={room.deposit}
            listedAt={room.createdAt}
            updatedAt={room.updatedAt}
            viewCount={room.viewCount}
            isVerified={room.isVerified}
            owner={room.owner}
          />
        </div>
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <ScrollReveal>
            <RoomFacts room={room} />
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <RoomAmenities room={room} />
          </ScrollReveal>
          {room.description ? (
            <ScrollReveal delay={150}>
              <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
                <h2 className="text-lg font-semibold">Mô tả</h2>
                <p className="mt-3 max-w-prose whitespace-pre-line text-base leading-relaxed text-zinc-700">
                  {room.description}
                </p>
              </section>
            </ScrollReveal>
          ) : null}
          <ScrollReveal delay={200}>
            <div className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
              <RoomLocationMap
                address={room.address}
                ward={room.ward}
                district={room.district}
                city={room.city}
                latitude={room.latitude}
                longitude={room.longitude}
              />
            </div>
          </ScrollReveal>
          <div className="flex justify-center border-t border-zinc-200 pt-6">
            <ReportDialog roomId={room.id} roomSlug={room.slug} variant="link" />
          </div>
        </div>
        <aside className="mt-8 space-y-6 lg:mt-0">
          {featuredRooms.length > 0 && (
            <ScrollReveal delay={250}>
              <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-zinc-900">Tin nổi bật</h2>
                <p className="mt-1 text-sm text-zinc-500">Gợi ý mới nhất tại khu vực này</p>
                <div className="mt-4 space-y-3">
                {featuredRooms.map((featured) => (
                  <Link
                    key={featured.id}
                    href={`/room/${featured.slug}`}
                    className="flex gap-3 rounded-lg border border-zinc-200 p-2 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-zinc-100">
                      <Image
                        src={featured.images[0]?.url ?? '/room1.jpg'}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="text-sm font-semibold text-brand-700">{formatPrice(featured.price)}</p>
                      <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-zinc-900">{featured.title}</h3>
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-zinc-500">
                        <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                        {featured.district}, {featured.city}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            </ScrollReveal>
          )}
        </aside>
      </div>

      {relatedRooms.length > 0 && (
        <ScrollReveal className="mt-12 border-t border-zinc-200 pt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Tin tương tự</h2>
              <p className="mt-1 text-sm text-zinc-500">Các tin cùng khu vực hoặc loại hình phòng</p>
            </div>
          </div>
          <RoomGrid rooms={relatedRooms} className="lg:grid-cols-4" />
        </ScrollReveal>
      )}

      {/* Sticky mobile contact bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-zinc-200 bg-white p-4 shadow-lg lg:hidden pb-safe-bottom">
        <div>
          <p className="text-xs text-zinc-500">Giá thuê</p>
          <p className="text-lg font-bold text-zinc-900">
            {formatPrice(room.price)}
            <span className="text-xs font-normal text-zinc-500">/tháng</span>
          </p>
        </div>
        <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
          <SheetTrigger asChild>
            <Button className="px-6">Liên hệ chủ trọ</Button>
          </SheetTrigger>
          <SheetContent className="rounded-l-xl h-full max-w-sm pb-8">
            <SheetHeader className="text-left border-b border-zinc-100 pb-3">
              <SheetTitle>Liên hệ chủ trọ</SheetTitle>
              <SheetDescription>Thông tin liên hệ của người đăng tin</SheetDescription>
            </SheetHeader>
            <SheetBody className="py-4">
              <RoomContactCard
                roomId={room.id}
                roomSlug={room.slug}
                price={room.price}
                deposit={room.deposit}
                listedAt={room.createdAt}
                updatedAt={room.updatedAt}
                viewCount={room.viewCount}
                isVerified={room.isVerified}
                owner={room.owner}
              />
            </SheetBody>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
