import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { RoomDetail, RoomSearchResult } from '@/features/rooms/api';
import { buildRoomJsonLd, buildRoomSeo } from '@/lib/seo/room';
import { serverFetch } from '@/lib/server-api';
import { RoomDetailContent } from './_components/room-detail-content';

type Props = { params: Promise<{ slug: string }> };

async function getRoom(slug: string): Promise<RoomDetail | null> {
  return serverFetch<RoomDetail>(`/rooms/${slug}`, { revalidate: 120 }).catch(
    () => null,
  );
}

async function getSimilarRooms(city: string, roomType: string, currentRoomId: number) {
  try {
    const res = await serverFetch<RoomSearchResult>(
      `/rooms?city=${encodeURIComponent(city)}&roomType=${roomType}&pageSize=6`,
      { revalidate: 120 },
    );
    return (res.rooms ?? []).filter((r) => r.id !== currentRoomId).slice(0, 4);
  } catch {
    return [];
  }
}

async function getRecommendedRooms(city: string, currentRoomId: number) {
  try {
    const res = await serverFetch<RoomSearchResult>(
      `/rooms?city=${encodeURIComponent(city)}&sort=newest&pageSize=10`,
      { revalidate: 120 },
    );
    return (res.rooms ?? []).filter((r) => r.id !== currentRoomId).slice(0, 7);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getRoom((await params).slug);
  if (!room) return {};

  const { canonical, title, description, images } = buildRoomSeo(room);
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images,
      type: 'website',
      locale: 'vi_VN',
      siteName: 'Trọ Ơi',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}

export default async function RoomDetailPage({ params }: Props) {
  const room = await getRoom((await params).slug);
  if (!room) notFound();

  const similarRooms = await getSimilarRooms(room.city, room.roomType, room.id);
  const recommendedRooms = await getRecommendedRooms(room.city, room.id);

  return (
    <div className="bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(buildRoomJsonLd(room)).replace(
              /</g,
              '\\u003c',
            ),
          }}
        />
        <RoomDetailContent
          room={room}
          similarRooms={similarRooms}
          recommendedRooms={recommendedRooms}
        />
      </div>
    </div>
  );
}
