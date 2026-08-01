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
      <div className="relative isolate overflow-hidden rounded-lg bg-brand-700 px-6 py-8 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-10 sm:py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 right-24 flex h-40 w-40 items-center justify-center rounded-full bg-white/10"
        >
          <House className="h-16 w-16 text-white/40" aria-hidden />
        </div>

        <div className="relative max-w-lg space-y-3">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Bạn là chủ trọ?
          </h2>
          <p className="text-sm text-brand-50/90 sm:text-base">
            Đăng tin miễn phí để tiếp cận hàng nghìn người thuê tiềm năng. Mọi tin
            đăng đều qua kiểm duyệt để giữ uy tín cho cả hai bên.
          </p>
        </div>
        <Button size="lg" variant="secondary" className="relative mt-6 shrink-0 sm:mt-0" asChild>
            <Link href="/manage/listings/new">Đăng tin miễn phí</Link>
        </Button>
      </div>
    </section>
  );
}
