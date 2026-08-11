import Link from 'next/link';
import { BadgeCheck, ClipboardPlus, Clock3, House } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LANDLORD_STEPS = [
  { icon: BadgeCheck, label: 'Xác minh số điện thoại' },
  { icon: ClipboardPlus, label: 'Đăng tin' },
  { icon: Clock3, label: 'Chờ admin duyệt' },
] as const;

/**
 * The reference design pairs this with a stock photo of a person — we skip
 * that deliberately (no real landlord photo to show, and a stock photo here
 * would read like a fabricated testimonial) and use the same decorative glow
 * treatment as the hero instead, so the brand language stays consistent.
 */
export function LandlordCta() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <div className="group relative flex flex-col gap-6 overflow-hidden rounded-lg border border-zinc-200 bg-gradient-to-br from-white via-white to-brand-50/40 px-6 py-10 shadow-card sm:px-10 sm:py-12 md:flex-row md:items-start md:justify-between md:gap-12">
        {/* Subtle decorative glow blob */}
        <div className="absolute -bottom-24 -right-24 -z-10 h-72 w-72 rounded-full bg-brand-500/5 blur-3xl pointer-events-none group-hover:bg-brand-500/10 transition-colors duration-500" />

        <div className="flex flex-col items-start gap-4 sm:flex-row sm:gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand-100/60 bg-brand-50 text-brand-700 transition-colors duration-300 group-hover:bg-brand-100">
            <House className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              Bạn có phòng cho thuê?
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-600">
              Đăng tin miễn phí trên Trọ Ơi và tiếp cận người thuê đang tìm phòng phù hợp.
            </p>
            <div className="grid max-w-2xl gap-3 pt-3 sm:grid-cols-3 sm:gap-5">
              {LANDLORD_STEPS.map(({ icon: Icon, label }, index) => (
                <div key={label} className="flex items-center gap-2 text-sm text-zinc-700">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="mr-1 text-xs font-semibold text-brand-700">{index + 1}.</span>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button size="lg" className="w-full shrink-0 shadow-card transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] sm:w-auto" asChild>
          <Link href="/manage/listings/new">Đăng tin miễn phí</Link>
        </Button>
      </div>
    </section>
  );
}
