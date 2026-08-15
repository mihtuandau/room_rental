import { PageContainer } from '@/components/layout/page-shell';
import { AmenitiesSkeleton } from './amenities-view';

export default function AdminAmenitiesLoading() {
  return (
    <PageContainer>
      <AmenitiesSkeleton />
    </PageContainer>
  );
}
