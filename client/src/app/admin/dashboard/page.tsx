import type { Metadata } from 'next';
import { AdminDashboardView } from './admin-dashboard-view';

export const metadata: Metadata = { title: 'Tổng quan quản trị', robots: { index: false, follow: false } };

export default function AdminDashboardPage() {
  return <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6"><AdminDashboardView /></div>;
}
