import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Bath, BedDouble, Check, MapPin, Ruler, Users, Wallet } from 'lucide-react';
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
  const displayAddress = Array.from(
    new Set(
      [room.address, room.ward, room.district, room.city].filter(
        (part): part is string => Boolean(part),
      ),
    ),
  ).join(', ');

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            {displayAddress}
          </p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-900 lg:hidden">
          {formatPrice(room.price)}/tháng
        </p>
      </header>

      <RoomGallery title={room.title} images={room.images} isVerified={room.isVerified} />

      <div className="mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-8">
        <div className="space-y-6">
          {facts.length > 0 && (
            <section
              aria-label="Thông tin chính"
              className="grid grid-cols-2 gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-3 sm:p-5 md:grid-cols-5"
            >
              {facts.map((fact) => (
                <div key={fact.label} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                    <fact.icon className="h-5 w-5 text-brand-700" aria-hidden />
                  </span>
                  <span className="text-sm font-medium text-zinc-700">{fact.label}</span>
                </div>
              ))}
            </section>
          )}

          {amenityGroups.length > 0 && (
            <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
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
                          <Check className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
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
            <section className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Mô tả</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-base leading-relaxed text-zinc-700">
                {room.description}
              </p>
            </section>
          )}

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

        {/* Sticky on desktop; a plain block above the fold order on mobile. */}
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
      </div>
    </div>
  );
}
