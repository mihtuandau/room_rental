'use client';

import { useEffect } from 'react';
import { recordRoomView, type RoomDetail } from '@/features/rooms/api';

const VISITOR_ID_KEY = 'tro-oi-visitor-id';

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const visitorId = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

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

export function RoomViewTracker({ room }: { room: RoomDetail }) {
  useEffect(() => {
    try {
      void recordRoomView(room.id, getVisitorId()).catch(() => undefined);

      // Save to recently viewed
      const key = 'tro-oi-recently-viewed';
      const raw = window.localStorage.getItem(key);
      const items: TrackedRoom[] = raw ? (JSON.parse(raw) as TrackedRoom[]) : [];

      const newItem: TrackedRoom = {
        id: room.id,
        title: room.title,
        slug: room.slug,
        price: room.price,
        image: room.images[0]?.url || '',
        district: room.district,
        city: room.city,
        roomType: room.roomType,
      };

      const filtered = items.filter((x) => x.id !== room.id);
      filtered.unshift(newItem);

      window.localStorage.setItem(key, JSON.stringify(filtered.slice(0, 6)));
    } catch {
      // Storage can be disabled by the browser. Viewing the listing must still work.
    }
  }, [room]);

  return null;
}
