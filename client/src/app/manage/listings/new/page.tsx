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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Đăng tin cho thuê</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Điền đầy đủ thông tin để tin đăng được duyệt nhanh hơn. Mọi tin đăng đều qua
        kiểm duyệt trước khi hiển thị công khai.
      </p>

      <div className="mt-6">
        <NewListingForm amenities={amenities} provinces={provinces} />
      </div>
    </div>
  );
}
