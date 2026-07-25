import type { Metadata } from 'next';
import { serverFetch } from '@/lib/server-api';
import { fetchProvinces } from '@/features/locations/api';
import type { Amenity } from '@/features/amenities/api';
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
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Đăng tin cho thuê</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn. Mọi tin đăng đều qua
        kiểm duyệt trước khi hiển thị công khai.
      </p>

      <div className="mt-8">
        <NewListingForm amenities={amenities} provinces={provinces} />
      </div>
    </div>
  );
}
