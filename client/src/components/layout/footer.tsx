import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import type { RoomSearchResult } from '@/features/rooms/api';

async function getActiveLocationLinks() {
  try {
    const data = await serverFetch<RoomSearchResult>('/rooms?pageSize=50', {
      revalidate: 300,
    });
    const rooms = data?.rooms ?? [];

    const cityMap = new Map<string, number>();
    const districtMap = new Map<
      string,
      { city: string; district: string; count: number }
    >();

    rooms.forEach((r) => {
      if (r.city) {
        cityMap.set(r.city, (cityMap.get(r.city) ?? 0) + 1);
      }
      if (r.city && r.district) {
        const key = `${r.city}-${r.district}`;
        const existing = districtMap.get(key);
        districtMap.set(key, {
          city: r.city,
          district: r.district,
          count: (existing?.count ?? 0) + 1,
        });
      }
    });

    const links: { label: string; href: string }[] = [
      { label: 'Tất cả tin đăng', href: '/' },
    ];

    // Add live city search links dynamically from database
    cityMap.forEach((_count, city) => {
      links.push({
        label: `Phòng trọ tại ${city}`,
        href: `/?city=${encodeURIComponent(city)}&all=true`,
      });
    });

    // Add live district search links dynamically from database
    districtMap.forEach(({ city, district }) => {
      links.push({
        label: `Phòng trọ ${district}`,
        href: `/?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}&all=true`,
      });
    });

    // Fallback list if database has no listing locations yet
    if (links.length <= 1) {
      return [
        { label: 'Tất cả tin đăng', href: '/' },
        {
          label: 'Phòng trọ TP. Hồ Chí Minh',
          href: '/?city=H%E1%BB%93+Ch%C3%AD+Minh&all=true',
        },
        { label: 'Phòng trọ Hà Nội', href: '/?city=H%C3%A0+N%E1%BB%99i&all=true' },
        { label: 'Phòng trọ Bình Thạnh', href: '/rooms-for-rent/binh-thanh' },
        { label: 'Phòng trọ Quận 7', href: '/rooms-for-rent/quan-7' },
      ];
    }

    return links.slice(0, 7);
  } catch {
    return [
      { label: 'Tất cả tin đăng', href: '/' },
      {
        label: 'Phòng trọ TP. Hồ Chí Minh',
        href: '/?city=H%E1%BB%93+Ch%C3%AD+Minh&all=true',
      },
      { label: 'Phòng trọ Hà Nội', href: '/?city=H%C3%A0+N%E1%BB%99i&all=true' },
      { label: 'Phòng trọ Bình Thạnh', href: '/rooms-for-rent/binh-thanh' },
      { label: 'Phòng trọ Quận 7', href: '/rooms-for-rent/quan-7' },
    ];
  }
}

export async function Footer() {
  const locationLinks = await getActiveLocationLinks();

  const linkGroups = [
    {
      title: 'Tìm phòng theo khu vực',
      links: locationLinks,
    },
    {
      title: 'Cho thuê',
      links: [
        { label: 'Đăng tin', href: '/manage/listings/new' },
        { label: 'Tin của tôi', href: '/manage/listings' },
      ],
    },
    {
      title: 'Hỗ trợ & Liên hệ',
      links: [
        { label: 'Email: hotro@trooi.vn', href: 'mailto:hotro@trooi.vn' },
        { label: 'Hotline: 090 123 4567', href: 'tel:0901234567' },
        { label: 'Chính sách bảo mật', href: '/privacy' },
      ],
    },
  ];

  return (
    <footer className="mt-12 border-t border-brand-100/80 bg-brand-50/60 sm:mt-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] sm:px-6">
        <div className="space-y-2">
          <Image
            src="/logo.png"
            alt="Trọ Ơi"
            width={48}
            height={48}
            className="h-12 w-12"
          />

          <p className="max-w-prose text-sm text-zinc-600">
            Tìm phòng trọ, nhà nguyên căn và chung cư mini. Mọi tin đăng đều qua kiểm
            duyệt trước khi hiển thị.
          </p>
        </div>

        {linkGroups.map((group) => (
          <div key={group.title}>
            <nav aria-label={group.title} className="hidden space-y-3 sm:block">
              <h2 className="text-sm font-semibold text-zinc-900">{group.title}</h2>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md text-sm text-zinc-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <details className="group sm:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between border-b border-brand-100/80 py-3 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
                {group.title}
                <ChevronDown className="h-4 w-4 text-zinc-500 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <ul className="space-y-2 py-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-md text-sm text-zinc-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-100/70">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 text-xs text-zinc-500 sm:px-6">
          <p>© {new Date().getFullYear()} Trọ Ơi. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
