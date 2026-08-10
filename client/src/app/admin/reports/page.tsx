import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-shell';
import { AdminReportsView } from './reports-view';

export const metadata: Metadata = {
  title: 'Báo cáo',
  robots: { index: false, follow: false },
};

export default function AdminReportsPage() {
  return <PageContainer><AdminReportsView /></PageContainer>;
}
