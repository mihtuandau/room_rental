import type { Metadata } from 'next';
import { AdminUsersView } from './users-view';

export const metadata: Metadata = {
  title: 'Người dùng quản trị',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <div className="mx-auto w-full px-5 py-8 sm:px-6 lg:px-8 xl:px-10">
      <AdminUsersView />
    </div>
  );
}
