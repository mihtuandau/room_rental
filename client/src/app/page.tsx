import Link from 'next/link';
import { Search, ShieldCheck } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { ROOM_TYPE_LABELS, type RoomType } from '@/lib/constants';
import { formatPriceShort } from '@/lib/utils';

interface RoomListItem {
  id: number;
  title: string;
  slug: string;
  price: number;
  area: number | null;
  city: string;
  district: string;
  roomType: RoomType;
  isVerified: boolean;
  images: { url: string }[];
}

async function getLatestRooms() {
  return serverFetch<{ rooms: RoomListItem[]; total: number }>('/rooms?pageSize=6', {
    revalidate: 60,
  }).catch(() => null);
}

export default async function HomePage() {
  const data = await getLatestRooms();

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <section className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Tìm phòng trọ với tin đã xác minh
        </h1>
        <p className="mx-auto mt-2 max-w-prose text-sm text-zinc-600">
          Phòng trọ, nhà nguyên căn, chung cư mini — mọi tin đăng đều qua kiểm duyệt.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/tim-kiem">
              <Search className="h-4 w-4" />
              Tìm phòng
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/quan-ly/dang-tin">Đăng tin</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="text-lg font-semibold">Tin đăng mới nhất</h2>

        {data === null ? (
          <EmptyState
            title="Không tải được danh sách phòng"
            description="Kiểm tra xem backend đã chạy ở cổng 3000 chưa."
          />
        ) : data.rooms.length === 0 ? (
          <EmptyState
            title="Chưa có tin đăng nào"
            description="Hãy là người đầu tiên đăng tin cho thuê."
            action={{ label: 'Đăng tin', href: '/quan-ly/dang-tin' }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.rooms.map((room) => (
              <article
                key={room.id}
                className="overflow-hidden rounded-lg border border-zinc-200 transition-shadow hover:shadow-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- swap to next/image once remote hosts are configured */}
                <img
                  src={room.images[0]?.url ?? 'https://placehold.co/400x300?text=RoomRent'}
                  alt={room.title}
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="space-y-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-medium">{room.title}</h3>
                    {room.isVerified && (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">
                        <ShieldCheck className="h-3 w-3" />
                        Đã xác minh
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">
                    {ROOM_TYPE_LABELS[room.roomType]} · {room.district}, {room.city}
                  </p>
                  <p className="text-base font-semibold">
                    {formatPriceShort(room.price)}/tháng
                    {room.area && (
                      <span className="ml-2 text-sm font-normal text-zinc-500">
                        {room.area} m²
                      </span>
                    )}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
