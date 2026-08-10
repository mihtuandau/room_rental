import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-shell';
import { AdminDashboardView } from './admin-dashboard-view';

export const metadata: Metadata = { title: 'Tổng quan quản trị', robots: { index: false, follow: false } };

export default function AdminDashboardPage() {
  return <PageContainer><AdminDashboardView /></PageContainer>;
}
