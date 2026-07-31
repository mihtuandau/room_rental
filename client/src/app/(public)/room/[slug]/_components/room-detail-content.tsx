import { MapPin } from 'lucide-react';
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

export function RoomDetailContent({ room }: { room: RoomDetail }) {
  const displayAddress = Array.from(
    new Set(
      [room.address, room.ward, room.district, room.city].filter(
        (part): part is string => Boolean(part),
      ),
    ),
  ).join(', ');

  return (
    <>
      <RoomViewTracker roomId={room.id} />
      <div className="flex items-center justify-between gap-4">
        <BackButton label="Quay lại kết quả tìm kiếm" />
        <RoomTitleActions roomId={room.id} roomSlug={room.slug} />
      </div>
      <header className="mb-5 mt-4">
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
      </header>
      <RoomGallery
        title={room.title}
        images={room.images}
        isVerified={room.isVerified}
      />
      <div className="mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <RoomFacts room={room} />
          <RoomAmenities room={room} />
          {room.description ? (
            <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Mô tả</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-base leading-relaxed text-zinc-700">
                {room.description}
              </p>
            </section>
          ) : null}
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
          <div className="flex justify-center border-t border-zinc-200 pt-6">
            <ReportDialog roomId={room.id} roomSlug={room.slug} variant="link" />
          </div>
        </div>
        <div className="mt-8 lg:sticky lg:top-20 lg:mt-0">
          <RoomContactCard
            roomId={room.id}
            roomSlug={room.slug}
            price={room.price}
            deposit={room.deposit}
            isVerified={room.isVerified}
            owner={room.owner}
          />
        </div>
      </div>
    </>
  );
}
