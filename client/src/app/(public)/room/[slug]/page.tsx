import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { RoomDetail } from '@/features/rooms/api';
import { serverFetch } from '@/lib/server-api';
import { RoomDetailContent } from './_components/room-detail-content';
import { buildRoomJsonLd, buildRoomSeo } from './_lib/room-seo';

type Props = { params: Promise<{ slug: string }> };

async function getRoom(slug: string): Promise<RoomDetail | null> {
  return serverFetch<RoomDetail>(`/rooms/${slug}`, { revalidate: 120 }).catch(
    () => null,
  );
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
        <RoomDetailContent room={room} />
      </div>
    </div>
  );
}
