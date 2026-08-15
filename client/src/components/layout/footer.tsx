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
      title: 'Về Trọ Ơi',
      links: [
        { label: 'Giới thiệu', href: '/about' },
        { label: 'Liên hệ', href: '/contact' },
        { label: 'Chính sách bảo mật', href: '/privacy' },
        { label: 'Điều khoản sử dụng', href: '/terms' },
      ],
    },
    {
      title: 'Hỗ trợ & Liên hệ',
      links: [
        { label: 'Email: hotro@trooi.vn', href: 'mailto:hotro@trooi.vn' },
        { label: 'Hotline: 090 123 4567', href: 'tel:0901234567' },
      ],
    },
  ];

  return (
    <footer className="mt-12 border-t border-border-subtle bg-surface-subtle sm:mt-16">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:gap-8 sm:px-6 sm:py-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr]">
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
          <div className="flex items-center gap-3 pt-2">
            <a
              href="https://facebook.com/trooi.vn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Image src="/logofacebook.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
            </a>
            <a
              href="https://instagram.com/trooi.vn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Image src="/logoinstagram.webp" alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-[5px] object-contain" />
            </a>
            <a
              href="https://x.com/trooi.vn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              <Image src="/logox.webp" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
            </a>
          </div>
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

      <div className="border-t border-border-subtle">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-xs text-zinc-500 sm:px-6 sm:pb-4">
          <p>© {new Date().getFullYear()} Trọ Ơi. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
