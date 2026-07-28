import type { Metadata } from 'next';
import { PendingRoomsView } from './pending-rooms-view';

export const metadata: Metadata = { title: 'Duyệt tin | RoomRent Admin' };

export default function PendingRoomsPage() {
  return (
    <div className="mx-auto w-full px-5 py-8 sm:px-6 lg:px-8 xl:px-10">
      <PendingRoomsView />
    </div>
  );
}
