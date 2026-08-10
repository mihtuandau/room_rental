import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-shell';
import { PendingRoomsView } from './pending-rooms-view';

export const metadata: Metadata = {
  title: 'Duyệt tin',
  robots: { index: false, follow: false },
};

export default function PendingRoomsPage() {
  return (
    <PageContainer>
      <PendingRoomsView />
    </PageContainer>
  );
}
