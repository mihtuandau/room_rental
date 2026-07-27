import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Quản trị',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  redirect('/admin/dashboard');
}
