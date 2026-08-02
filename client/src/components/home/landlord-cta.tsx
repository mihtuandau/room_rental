import Link from 'next/link';
import { House } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The reference design pairs this with a stock photo of a person — we skip
 * that deliberately (no real landlord photo to show, and a stock photo here
 * would read like a fabricated testimonial) and use the same decorative glow
 * treatment as the hero instead, so the brand language stays consistent.
 */
export function LandlordCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-white via-white to-brand-50/40 px-6 py-10 sm:px-10 sm:py-12 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-12 group">
        {/* Subtle decorative glow blob */}
        <div className="absolute -bottom-24 -right-24 -z-10 h-72 w-72 rounded-full bg-brand-500/5 blur-3xl pointer-events-none group-hover:bg-brand-500/10 transition-colors duration-500" />

        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 flex-1 min-w-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 border border-brand-100/60 transition-colors duration-300 group-hover:bg-brand-100">
            <House className="h-6 w-6" aria-hidden />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-zinc-900 sm:text-2xl tracking-tight">
              Bạn là chủ trọ đang tìm kiếm khách thuê?
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600 max-w-2xl">
              Đăng tin hoàn toàn miễn phí trên Trọ Ơi. Hệ thống kiểm duyệt minh bạch giúp bài đăng của bạn uy tín hơn, tiếp cận nhanh chóng hàng nghìn người thuê trọ mỗi ngày.
            </p>
          </div>
        </div>

        <Button size="lg" className="shrink-0 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm" asChild>
          <Link href="/manage/listings/new">Đăng tin miễn phí</Link>
        </Button>
      </div>
    </section>
  );
}
