import type { Metadata } from 'next';
import { FavoritesView } from './favorites-view';

export const metadata: Metadata = {
  title: 'Tin đã lưu',
  // Private, per-user content — nothing here should be indexed.
  robots: { index: false, follow: false },
};

export default function FavoritesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-xl font-semibold tracking-tight">Tin đã lưu</h1>
      <p className="mt-1 text-sm text-zinc-600">Những tin đăng bạn đã lưu để xem lại.</p>
      <div className="mt-6">
        <FavoritesView />
      </div>
    </div>
  );
}
