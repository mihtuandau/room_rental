import type { Metadata } from 'next';
import { PendingRoomsView } from './pending-rooms-view';

export const metadata: Metadata = {
  title: 'Duyệt tin',
  robots: { index: false, follow: false },
};

export default function PendingRoomsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 xl:px-10">
      <PendingRoomsView />
    </div>
  );
}
