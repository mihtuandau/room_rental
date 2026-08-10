import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-shell';
import { AdminAmenitiesView } from './amenities-view';
export const metadata: Metadata = {
  title: 'Tiện ích',
  robots: { index: false, follow: false },
};
export default function AdminAmenitiesPage() { return <PageContainer><AdminAmenitiesView /></PageContainer>; }
