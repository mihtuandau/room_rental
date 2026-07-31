import type { Metadata } from 'next';
import { findAreaLanding } from '@/lib/constants';

type AreaLanding = NonNullable<ReturnType<typeof findAreaLanding>>;

export function buildAreaMetadata(
  area: AreaLanding,
  page: number,
): Metadata {
  const pageSuffix = page > 1 ? ` — trang ${page}` : '';
  const canonical = `/rooms-for-rent/${area.slug}${
    page > 1 ? `?page=${page}` : ''
  }`;
  const title = `Phòng trọ ${area.label}${pageSuffix}`;
  const description = `Tìm phòng trọ, nhà nguyên căn, chung cư mini tại ${area.label}. Tin đăng được kiểm duyệt trước khi hiển thị và cập nhật mỗi ngày.`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'vi_VN',
      siteName: 'Trọ Ơi',
      url: canonical,
      images: [
        {
          url: '/banner.png',
          alt: `Tìm phòng trọ tại ${area.label} trên Trọ Ơi`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/banner.png'],
    },
  };
}
