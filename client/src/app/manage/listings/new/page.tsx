import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { fetchProvinces } from '@/features/locations/api';
import type { Amenity } from '@/features/amenities/api';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { NewListingForm } from './new-listing-form';

export const metadata: Metadata = {
  title: 'Đăng tin cho thuê',
  // A private, signed-in-only page — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default async function NewListingPage() {
  const [amenities, provinces] = await Promise.all([
    serverFetch<Amenity[]>('/amenities', { revalidate: 3600 }).catch(() => []),
    fetchProvinces(),
  ]);

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Đăng tin cho thuê"
        description="Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn. Mọi tin đăng đều qua kiểm duyệt trước khi hiển thị công khai."
      />

      <div>
        <NewListingForm
          amenities={amenities}
          provinces={provinces}
          phoneVerificationRequired={
            process.env.PHONE_VERIFICATION_REQUIRED === 'true'
          }
        />
      </div>
    </PageContainer>
  );
}
