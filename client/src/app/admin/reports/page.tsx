import type { Metadata } from 'next';
import { AdminReportsView } from './reports-view';

export const metadata: Metadata = { title: 'Báo cáo | RoomRent Admin', robots: { index: false, follow: false } };

export default function AdminReportsPage() {
  return <div className="mx-auto w-full px-5 py-8 sm:px-6 lg:px-8 xl:px-10"><AdminReportsView /></div>;
}
