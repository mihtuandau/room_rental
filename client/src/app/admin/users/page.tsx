import type { Metadata } from 'next';
import { AdminUsersView } from './users-view';

export const metadata: Metadata = {
  title: 'Người dùng quản trị',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <AdminUsersView />
    </div>
  );
}
