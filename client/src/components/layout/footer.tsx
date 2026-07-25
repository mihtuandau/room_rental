import Image from 'next/image';
import Link from 'next/link';

/**
 * Only links to routes that exist (or are planned in this milestone) — a footer
 * full of dead links reads as an abandoned site, which is the opposite of the
 * trust signal this product sells.
 */
const LINK_GROUPS = [
  {
    title: 'Tìm phòng',
    links: [
      { label: 'Tất cả tin đăng', href: '/' },
      { label: 'Phòng trọ Quận 7', href: '/rooms-for-rent/quan-7' },
      { label: 'Phòng trọ Bình Thạnh', href: '/rooms-for-rent/binh-thanh' },
    ],
  },
  {
    title: 'Cho thuê',
    links: [
      { label: 'Đăng tin', href: '/manage/listings/new' },
      { label: 'Tin của tôi', href: '/manage/listings' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 sm:mt-16">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.5fr_1fr_1fr] sm:px-6">
        <div className="space-y-2">
          <Image src="/logo.png" alt="Trọ Ơi" width={40} height={40} className="h-10 w-10" />

          <p className="max-w-prose text-sm text-zinc-600">
            Tìm phòng trọ, nhà nguyên căn và chung cư mini. Mọi tin đăng đều qua kiểm
            duyệt trước khi hiển thị.
          </p>
        </div>

        {LINK_GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title} className="space-y-3">
            <h2 className="text-sm font-semibold">{group.title}</h2>
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
        ))}
      </div>

      <div className="border-t border-zinc-100">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-zinc-500 sm:px-6">
          © {new Date().getFullYear()} Trọ Ơi
        </p>
      </div>
    </footer>
  );
}
