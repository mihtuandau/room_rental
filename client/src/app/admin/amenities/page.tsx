import type { Metadata } from 'next';
import { AdminAmenitiesView } from './amenities-view';
export const metadata: Metadata = { title: 'Tiện ích | Trọ Ơi Admin', robots: { index: false, follow: false } };
export default function AdminAmenitiesPage() { return <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 lg:px-8 xl:px-10"><AdminAmenitiesView /></div>; }
