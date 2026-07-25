import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { fetchProvinces } from '@/features/locations/api';
import type { Amenity } from '@/features/amenities/api';
import { BackButton } from '@/components/ui/back-button';
import { EditListingView } from './edit-listing-view';

export const metadata: Metadata = {
  title: 'Sửa tin đăng',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;

  const [amenities, provinces] = await Promise.all([
    serverFetch<Amenity[]>('/amenities', { revalidate: 3600 }).catch(() => []),
    fetchProvinces(),
  ]);

  return (
    <div className="w-full px-4 py-8 md:px-6">
        <BackButton label="Tin của tôi" className="mb-4 sm:hidden" />
      <EditListingView roomId={Number(id)} amenities={amenities} provinces={provinces} />
    </div>
  );
}
