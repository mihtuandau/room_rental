import { formatPrice, formatPriceShort } from '@/lib/utils';
import {
  ROOM_TYPE_LABELS,
  type RoomType,
} from '@/lib/constants';
import type { RoomDetail } from '@/features/rooms/api';

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:5000'
).replace(/\/+$/, '');

const SCHEMA_ROOM_TYPES: Record<RoomType, 'Room' | 'House' | 'Apartment'> = {
  boarding_house: 'Room',
  whole_house: 'House',
  mini_apartment: 'Apartment',
  serviced_apartment: 'Apartment',
  shared_room: 'Room',
};

export function truncateSeoText(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const shortened = normalized.slice(0, maxLength - 1);
  const lastSpace = shortened.lastIndexOf(' ');
  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : undefined).trim()}…`;
}

export function buildRoomSeo(room: RoomDetail) {
  const where = [room.district, room.city].filter(Boolean).join(', ');
  const canonical = `/room/${room.slug}`;
  const title = truncateSeoText(
    `${room.title} — ${formatPriceShort(room.price)}, ${where}`,
    58,
  );
  const summary = `${ROOM_TYPE_LABELS[room.roomType]} tại ${where}, giá ${formatPrice(room.price)}/tháng.`;
  const description = truncateSeoText(
    `${summary} ${room.description?.trim() ?? ''} Tin đăng đã được kiểm duyệt trên Trọ Ơi.`,
    155,
  );
  const images = room.images.length
    ? room.images.map((image) => ({ url: image.url, alt: room.title }))
    : [{ url: '/banner.png', alt: 'Trọ Ơi — tìm phòng trọ đã xác minh' }];

  return { canonical, title, description, images };
}

export function buildRoomJsonLd(room: RoomDetail) {
  const roomUrl = `${SITE_URL}/room/${room.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': SCHEMA_ROOM_TYPES[room.roomType],
    name: room.title,
    description: room.description ?? undefined,
    url: roomUrl,
    mainEntityOfPage: roomUrl,
    image: room.images.map((image) => image.url),
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
    offers: {
      '@type': 'Offer',
      price: room.price,
      priceCurrency: 'VND',
      url: roomUrl,
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
}
