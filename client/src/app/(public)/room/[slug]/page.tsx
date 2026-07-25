import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bath, BedDouble, Ruler, Users, Wallet } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { formatPrice, formatPriceShort } from '@/lib/utils';
import { AMENITY_TYPE_LABELS, ROOM_TYPE_LABELS, type AmenityType } from '@/lib/constants';
import type { RoomDetail } from '@/features/rooms/api';
import { BackButton } from '@/components/ui/back-button';
import { RoomGallery } from '@/components/rooms/room-gallery';
import { RoomLocationMap } from '@/components/rooms/room-location-map';
import { RoomContactCard } from '@/components/rooms/room-contact-card';
import { RoomTitleActions } from '@/components/rooms/room-title-actions';
import { ReportDialog } from '@/components/rooms/report-dialog';

type Props = { params: Promise<{ slug: string }> };

const AMENITY_TYPE_ORDER: AmenityType[] = ['basic', 'utility', 'security', 'nearby'];

// public route is /room/<slug>, the API path is /rooms/<slug>
async function getRoom(slug: string): Promise<RoomDetail | null> {
  return serverFetch<RoomDetail>(`/rooms/${slug}`, { revalidate: 120 }).catch(
    () => null,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getRoom((await params).slug);
  if (!room) return {};

  const where = [room.district, room.city].filter(Boolean).join(', ');
  return {
    title: `${room.title} — ${formatPriceShort(room.price)}/tháng, ${where}`,
    description:
      room.description?.slice(0, 155) ??
      `${ROOM_TYPE_LABELS[room.roomType]} tại ${where}, tin đã kiểm duyệt trên Trọ Ơi.`,
    alternates: { canonical: `/room/${room.slug}` },
    openGraph: {
      title: room.title,
      description: room.description?.slice(0, 155),
      images: room.images[0] ? [room.images[0].url] : [],
      type: 'website',
    },
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const room = await getRoom((await params).slug);
  if (!room) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: room.title,
    description: room.description ?? undefined,
    numberOfRooms: room.bedrooms ?? undefined,
    floorSize: room.area
      ? { '@type': 'QuantitativeValue', value: room.area, unitCode: 'MTK' }
      : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: room.address ?? undefined,
      addressLocality: room.district,
      addressRegion: room.city,
      addressCountry: 'VN',
    },
    ...(room.latitude != null && room.longitude != null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: room.latitude,
            longitude: room.longitude,
          },
        }
      : {}),
  };

  // Every fact here is a real field on the room — nothing invented (no
  // "availability" or "maintenance fee", which this product doesn't track).
  const facts = [
    room.bedrooms != null && { icon: BedDouble, label: `${room.bedrooms} phòng ngủ` },
    room.bathrooms != null && { icon: Bath, label: `${room.bathrooms} phòng tắm` },
    room.area != null && { icon: Ruler, label: `${room.area} m²` },
    room.maxOccupants != null && {
      icon: Users,
      label: `Tối đa ${room.maxOccupants} người`,
    },
    room.deposit != null && { icon: Wallet, label: `Cọc ${formatPrice(room.deposit)}` },
  ].filter((f): f is { icon: typeof BedDouble; label: string } => !!f);

  const amenityGroups = AMENITY_TYPE_ORDER.map((type) => ({
    type,
    items: room.amenities.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BackButton label="Quay lại kết quả tìm kiếm" className="mb-4" />

      <RoomGallery title={room.title} images={room.images} isVerified={room.isVerified} />

      <div className="mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-10">
        <div className="space-y-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {room.title}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                {ROOM_TYPE_LABELS[room.roomType]} ·{' '}
                {[room.address, room.ward, room.district, room.city]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p className="mt-2 text-lg font-semibold lg:hidden">
                {formatPrice(room.price)}/tháng
              </p>
            </div>
            <RoomTitleActions roomId={room.id} />
          </div>

          {facts.length > 0 && (
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-zinc-200 p-5 sm:grid-cols-3 md:grid-cols-5">
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col items-center gap-2 text-center">
                  <fact.icon className="h-5 w-5 text-zinc-400" aria-hidden />
                  <span className="text-sm text-zinc-700">{fact.label}</span>
                </div>
              ))}
            </div>
          )}

          {amenityGroups.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Tiện ích</h2>
              <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                {amenityGroups.map((group) => (
                  <div key={group.type} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                      {AMENITY_TYPE_LABELS[group.type]}
                    </p>
                    <ul className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                      {group.items.map((amenity) => (
                        <li
                          key={amenity.id}
                          className="flex items-center gap-2 text-sm text-zinc-700"
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                          {amenity.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {room.description && (
            <section>
              <h2 className="text-lg font-semibold">Mô tả</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-sm leading-relaxed text-zinc-700">
                {room.description}
              </p>
            </section>
          )}

          <RoomLocationMap
            address={room.address}
            ward={room.ward}
            district={room.district}
            city={room.city}
            latitude={room.latitude}
            longitude={room.longitude}
          />

          <div className="border-t border-zinc-200 pt-6">
            <ReportDialog roomId={room.id} variant="link" />
          </div>
        </div>

        {/* Sticky on desktop; a plain block above the fold order on mobile. */}
        <div className="mt-8 lg:sticky lg:top-20 lg:mt-0">
          <RoomContactCard
            roomId={room.id}
            price={room.price}
            deposit={room.deposit}
            isVerified={room.isVerified}
            owner={room.owner}
          />
        </div>
      </div>
    </div>
  );
}
