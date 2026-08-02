'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface TrackedRoom {
  id: number;
  title: string;
  slug: string;
  price: number;
  image: string;
  district: string;
  city: string;
  roomType: string;
}

export function RecentlyViewed() {
  const [items, setItems] = useState<TrackedRoom[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('tro-oi-recently-viewed');
      if (raw) {
        setItems(JSON.parse(raw));
      }
    } catch {
      // localStorage disabled
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-brand-600" aria-hidden />
        <h2 className="text-lg font-semibold">Đã xem gần đây</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((room) => (
          <Link
            key={room.id}
            href={`/room/${room.slug}`}
            className="group flex gap-3 rounded-lg border border-zinc-200 bg-white p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-600 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-zinc-100">
              <Image
                src={room.image || '/room1.jpg'}
                alt=""
                fill
                sizes="64px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
              <h3 className="line-clamp-1 text-xs font-semibold text-zinc-900 group-hover:text-brand-700 transition-colors">
                {room.title}
              </h3>
              <div>
                <p className="text-[10px] text-zinc-500 truncate">
                  {room.district}, {room.city}
                </p>
                <p className="text-xs font-bold text-brand-700 mt-0.5">
                  {formatPrice(room.price)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
