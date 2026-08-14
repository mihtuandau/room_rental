import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  Phone,
  ArrowRight,
  Sparkles,
  Lock,
  Building,
  UserCheck,
} from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Về Trọ Ơi — Nền tảng tìm phòng trọ đã xác minh',
  description:
    'Trọ Ơi ra đời nhằm giải quyết bài toán tin ảo, lừa đảo cọc và thông tin không rõ ràng khi tìm phòng trọ tại Việt Nam.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'Về Trọ Ơi — Nền tảng tìm phòng trọ đã xác minh',
    description:
      'Kết nối trực tiếp giữa người thuê và chủ trọ với 100% tin đăng được kiểm duyệt thực tế.',
    type: 'website',
    url: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="bg-surface-page w-full pb-24 overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-brand-50/70 via-brand-50/30 to-surface-page px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Narrative */}
            <div className="lg:col-span-7">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-xs backdrop-blur-xs">
                  <Sparkles className="h-3.5 w-3.5 text-brand-600" aria-hidden />
                  <span>Sứ mệnh minh bạch hóa thị trường phòng trọ</span>
                </div>
                <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl sm:leading-[1.15]">
                  Nơi mỗi tin đăng phòng trọ đều được{' '}
                  <span className="text-brand-700 underline decoration-brand-300 decoration-wavy decoration-2 underline-offset-4">
                    kiểm duyệt thực tế
                  </span>
                </h1>
                <p className="mt-5 text-base leading-relaxed text-zinc-600 sm:text-lg">
                  Trọ Ơi ra đời với mục tiêu đơn giản nhưng quyết liệt: chấm dứt tình trạng tin ảo, mô tả sai sự thật và lừa đảo cọc. Chúng tôi giúp người thuê tìm được nơi ở an tâm và giúp chủ trọ uy tín tiếp cận người thuê thực sự.
                </p>
              </ScrollReveal>

              {/* Metric Highlights */}
              <ScrollReveal delay={100} className="mt-8">
                <div className="grid grid-cols-3 gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-card sm:gap-6 sm:p-6">
                  <div>
                    <p className="text-2xl font-bold text-brand-700 sm:text-3xl">100%</p>
                    <p className="mt-1 text-xs text-zinc-500 sm:text-sm font-medium">Kiểm duyệt trước khi đăng</p>
                  </div>
                  <div className="border-l border-zinc-200 pl-3 sm:pl-6">
                    <p className="text-2xl font-bold text-zinc-900 sm:text-3xl">0đ</p>
                    <p className="mt-1 text-xs text-zinc-500 sm:text-sm font-medium">Phí môi giới cho người thuê</p>
                  </div>
                  <div className="border-l border-zinc-200 pl-3 sm:pl-6">
                    <p className="text-2xl font-bold text-zinc-900 sm:text-3xl">&lt; 24h</p>
                    <p className="mt-1 text-xs text-zinc-500 sm:text-sm font-medium">Thời gian phê duyệt tin</p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={150} className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/?all=true">
                    Khám phá phòng trọ ngay
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/manage/listings/new">Dành cho chủ trọ đăng tin</Link>
                </Button>
              </ScrollReveal>
            </div>

            {/* Right Visual Collage */}
            <div className="lg:col-span-5">
              <ScrollReveal delay={120} className="relative">
                <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-xl sm:aspect-[16/11]">
                  <Image
                    src="/banner.png"
                    alt="Phòng trọ thực tế minh bạch trên Trọ Ơi"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 45vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Floating Verified Pill */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl bg-white/95 p-3.5 shadow-popover backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <ShieldCheck className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900">Trạng thái tin đăng</p>
                        <p className="text-[11px] font-medium text-brand-700">Đã đối soát vị trí & hình ảnh</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-800">
                      Xác thực
                    </span>
                  </div>
                </div>

                {/* Secondary Offset Photo Card */}
                <div className="absolute -bottom-6 -left-6 hidden w-48 overflow-hidden rounded-xl border border-white bg-white shadow-2xl sm:block">
                  <div className="relative h-28 w-full">
                    <Image
                      src="/phong_tro.png"
                      alt="Hình ảnh thực tế"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2.5 text-center">
                    <p className="text-[11px] font-semibold text-zinc-800">Ảnh chụp thực tế 100%</p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* The Real Problem & Our Solution */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <ScrollReveal>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Vấn đề thực tế</span>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                  Thực trạng tìm phòng trọ tại các đô thị lớn
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
                  Người đi thuê trọ — đặc biệt là sinh viên và người đi làm trẻ — thường đối mặt với các bẫy thông tin dai dẳng:
                </p>
              </ScrollReveal>
            </div>

            <div className="space-y-4 lg:col-span-7">
              {[
                {
                  title: 'Tin ảo, giá ảo thu hút người xem',
                  desc: 'Đăng phòng đẹp giá 2 triệu nhưng khi đến nơi lại bảo "đã hết phòng" rồi dẫn đi xem phòng khác kém chất lượng với giá cao hơn.',
                },
                {
                  title: 'Lừa đảo tiền cọc giữ chỗ',
                  desc: 'Yêu cầu chuyển khoản cọc trước khi xem phòng trực tiếp thông qua các tài khoản mạo danh trên mạng xã hội.',
                },
                {
                  title: 'Cò mồi chèn ép chủ trọ uy tín',
                  desc: 'Chủ nhà chính chủ bị mạo danh tin đăng, thông tin liên hệ bị thay đổi bởi giới trung gian không minh bạch.',
                },
              ].map((item, idx) => (
                <ScrollReveal key={item.title} delay={idx * 80}>
                  <div className="flex gap-4 rounded-xl border border-zinc-100 bg-zinc-50/70 p-5 transition-colors hover:border-brand-200 hover:bg-brand-50/30">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-50 text-xs font-bold text-danger-600">
                      !
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-zinc-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600">{item.desc}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Commitments */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Cam kết chất lượng</span>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            3 Nguyên tắc vận hành tại Trọ Ơi
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-zinc-500 sm:text-base">
            Mọi tính năng trên hệ thống đều phục vụ trực tiếp cho trải nghiệm minh bạch và an toàn.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              icon: UserCheck,
              title: 'Xác thực người đăng',
              desc: 'Số điện thoại và tài khoản chủ trọ được xác minh trước khi được cấp quyền đăng tin public.',
            },
            {
              icon: Lock,
              title: 'Kiểm duyệt nội dung',
              desc: 'Đội ngũ quản trị đối soát thông tin địa chỉ, hình ảnh thực tế và mức giá niêm yết trong vòng 24h.',
            },
            {
              icon: Phone,
              title: 'Kết nối trực tiếp',
              desc: 'Người thuê liên hệ thẳng với chủ nhà qua cuộc gọi hoặc Zalo. Không có phí ẩn hay phí môi giới.',
            },
          ].map((card, i) => (
            <ScrollReveal key={card.title} delay={i * 100}>
              <div className="group flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <card.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-6 font-heading text-xl font-bold text-zinc-900">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">{card.desc}</p>
                </div>
                <div className="mt-6 border-t border-zinc-100 pt-4 text-xs font-semibold text-brand-700">
                  Tiêu chuẩn minh bạch ✓
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Process for Both Parties */}
      <section className="mt-12 bg-zinc-900 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Quy trình rõ ràng</span>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-4xl">
              Đơn giản cho người thuê, hiệu quả cho chủ trọ
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Tenant Column */}
            <ScrollReveal className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-zinc-950">
                  <Search className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-heading text-xl font-bold">Dành cho người đi thuê</h3>
              </div>
              <div className="mt-8 space-y-6">
                {[
                  { step: '01', title: 'Tìm theo khu vực & ngân sách', detail: 'Sử dụng bộ lọc diện tích, mức giá và vị trí trên bản đồ tương tác.' },
                  { step: '02', title: 'Xem tin đăng đã xác minh', detail: 'Kiểm tra kỹ hình ảnh, danh sách tiện ích và thời gian cập nhật phòng trống.' },
                  { step: '03', title: 'Hẹn giờ xem phòng trực tiếp', detail: 'Gọi điện hoặc nhắn Zalo cho chủ trọ. Luôn xem phòng trước khi quyết định.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <span className="font-mono text-sm font-bold text-brand-400">{s.step}</span>
                    <div>
                      <h4 className="text-base font-semibold text-zinc-100">{s.title}</h4>
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Landlord Column */}
            <ScrollReveal delay={100} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-zinc-950">
                  <Building className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-heading text-xl font-bold">Dành cho chủ nhà & quản lý</h3>
              </div>
              <div className="mt-8 space-y-6">
                {[
                  { step: '01', title: 'Tạo tài khoản & xác minh số điện thoại', detail: 'Đảm bảo quyền chủ tin và bảo mật thông tin liên hệ chính chủ.' },
                  { step: '02', title: 'Đăng tin phòng trống miễn phí', detail: 'Tải ảnh thực tế, nhập thông tin giá điện nước và tiện ích rõ ràng.' },
                  { step: '03', title: 'Nhận yêu cầu xem phòng thực', detail: 'Tiếp cận người thuê có nhu cầu ở thực sự mà không tốn phí môi giới.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4">
                    <span className="font-mono text-sm font-bold text-zinc-400">{s.step}</span>
                    <div>
                      <h4 className="text-base font-semibold text-zinc-100">{s.title}</h4>
                      <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="mx-auto max-w-5xl px-4 pt-16 sm:px-6 sm:pt-24 text-center">
        <ScrollReveal>
          <div className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-brand-50/50 p-8 shadow-lg sm:p-12">
            <h2 className="font-heading text-2xl font-bold text-zinc-900 sm:text-3xl">
              Sẵn sàng tìm cho mình một không gian sống phù hợp?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-600 sm:text-base">
              Hàng ngàn tin đăng phòng trọ, chung cư mini và nhà nguyên căn đang chờ bạn khám phá.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/?all=true">Tìm phòng ngay</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">Liên hệ hỗ trợ</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
