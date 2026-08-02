'use client';

import { useEffect } from 'react';
import { recordRoomView } from '@/features/rooms/api';

const VISITOR_ID_KEY = 'tro-oi-visitor-id';

function getVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_ID_KEY);
  if (existing) return existing;

  const visitorId = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

export function RoomViewTracker({ roomId }: { roomId: number }) {
  useEffect(() => {
    try {
      void recordRoomView(roomId, getVisitorId()).catch(() => undefined);
    } catch {
      // Storage can be disabled by the browser. Viewing the listing must still work.
    }
  }, [roomId]);

  return null;
}
