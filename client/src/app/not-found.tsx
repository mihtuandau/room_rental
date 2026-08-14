import Link from 'next/link';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="flex max-w-lg flex-col items-center text-center">
        {/* Large decorative 404 */}
        <div className="relative">
          <span className="select-none text-[8rem] font-bold leading-none tracking-tighter text-zinc-100 sm:text-[10rem]">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-card">
              <Search className="h-7 w-7" aria-hidden />
            </div>
          </div>
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Không tìm thấy trang
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
          Trang hoặc tin đăng bạn tìm có thể đã được gỡ bỏ, đổi địa chỉ hoặc không còn hiển thị.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Search className="h-4 w-4" aria-hidden />
              Tìm phòng
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Về trang chủ
            </Link>
          </Button>
        </div>

        {/* Quick links */}
        <div className="mt-10 w-full rounded-xl border border-border-subtle bg-surface-subtle p-5">
          <p className="text-xs font-medium text-zinc-500">Bạn có thể thử:</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {[
              { label: 'Tìm phòng trọ', href: '/?all=true' },
              { label: 'Đăng tin', href: '/manage/listings/new' },
              { label: 'Liên hệ hỗ trợ', href: '/contact' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
