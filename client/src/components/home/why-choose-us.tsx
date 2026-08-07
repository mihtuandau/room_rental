import {
  BadgeCheck,
  CircleDollarSign,
  RefreshCcw,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';

/* ─── Data ─────────────────────────────────────────────────────────── */
const REASONS = [
  {
    icon: BadgeCheck,
    title: 'Tin đăng rõ ràng',
    description:
      'Chúng tôi kiểm duyệt thông tin và hình ảnh thực tế nghiêm ngặt trước khi hiển thị công khai. Bạn hoàn toàn yên tâm tìm kiếm mà không sợ lừa đảo.',
  },
  {
    icon: CircleDollarSign,
    title: 'Liên hệ trực tiếp',
    description:
      'Trao đổi thẳng với chủ trọ, không qua môi giới và hoàn toàn không phát sinh phí.',
  },
  {
    icon: RefreshCcw,
    title: 'Cập nhật liên tục',
    description:
      'Trạng thái phòng được đồng bộ thời gian thực, giúp bạn không mất thời gian với phòng đã có người.',
  },
] as const;

/* ─── Component ─────────────────────────────────────────────────────── */
export function WhyChooseUs() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <ScrollReveal className="mb-6 lg:mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Vì sao chọn <span className="text-brand-700">Trọ Ơi?</span>
        </h2>
        <p className="mt-1.5 max-w-xl text-sm text-zinc-500">
          Trải nghiệm tìm phòng đơn giản, minh bạch và an tâm hơn mỗi ngày.
        </p>
      </ScrollReveal>
      
      {/* Consistent 3-column Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {REASONS.map(({ icon: Icon, title, description }, i) => (
          <ScrollReveal
            key={title}
            delay={i * 150}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500 hover:shadow-md sm:p-8"
          >
            <div className="relative z-10">
              <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 transition-colors duration-300 group-hover:bg-brand-50 group-hover:text-brand-700">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              
              <h3 className="text-lg font-semibold text-zinc-900 lg:text-xl">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {description}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
