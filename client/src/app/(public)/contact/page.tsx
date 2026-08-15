import type { Metadata } from 'next';
import { Mail, Phone, MessageSquare, ChevronDown, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/scroll-reveal';
import { ContactInquiryForm } from './_components/contact-inquiry-form';

export const metadata: Metadata = {
  title: 'Liên hệ hỗ trợ — Trọ Ơi',
  description: 'Liên hệ với đội ngũ Trọ Ơi qua Hotline, Zalo, Email hoặc gửi yêu cầu hỗ trợ trực tiếp.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Liên hệ hỗ trợ — Trọ Ơi',
    description: 'Đội ngũ Trọ Ơi luôn sẵn sàng hỗ trợ giải đáp thắc mắc và kiểm duyệt tin đăng.',
    type: 'website',
    url: '/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="bg-surface-page w-full pb-24">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-brand-50/60 via-brand-50/20 to-surface-page px-4 pt-12 pb-12 sm:px-6 sm:pt-16 sm:pb-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <ScrollReveal>
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Trung tâm hỗ trợ</span>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              Liên hệ với đội ngũ Trọ Ơi
            </h1>
            <p className="mt-3 max-w-2xl text-base text-zinc-600 sm:text-lg">
              Bạn cần hỗ trợ tìm phòng, giải đáp quy trình đăng tin hoặc báo cáo tin đăng vi phạm? Chúng tôi luôn sẵn sàng hỗ trợ.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Direct Contact Info & Office */}
          <div className="space-y-8 lg:col-span-5">
            <ScrollReveal>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card sm:p-8">
                <h2 className="font-heading text-xl font-bold text-zinc-900">Kênh liên hệ trực tiếp</h2>
                <p className="mt-1 text-xs text-zinc-500">Phản hồi nhanh nhất qua Hotline & Zalo trong giờ hành chính.</p>

                <div className="mt-6 space-y-4">
                  <a
                    href="tel:0901234567"
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Phone className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Hotline tư vấn</p>
                        <p className="text-base font-bold text-zinc-900 group-hover:text-brand-700">090 123 4567</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-brand-700">Gọi ngay →</span>
                  </a>

                  <a
                    href="mailto:hotro@trooi.vn"
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <Mail className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Email hỗ trợ</p>
                        <p className="text-base font-bold text-zinc-900 group-hover:text-brand-700">hotro@trooi.vn</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-brand-700">Gửi mail →</span>
                  </a>

                  <a
                    href="https://zalo.me/trooi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:border-brand-300 hover:bg-brand-50/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                        <MessageSquare className="h-5 w-5" aria-hidden />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-zinc-500">Zalo Official Account</p>
                        <p className="text-base font-bold text-zinc-900 group-hover:text-brand-700">Trọ Ơi Hỗ Trợ</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-brand-700">Chat Zalo →</span>
                  </a>
                </div>

                <div className="mt-6 border-t border-zinc-100 pt-6 space-y-3">
                  <div className="flex items-center gap-2.5 text-xs text-zinc-600">
                    <Clock className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                    <span>Thứ 2 – Thứ 7: 08:00 – 18:00</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-zinc-600">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-600 mt-0.5" aria-hidden />
                    <span>TP. Hồ Chí Minh, Việt Nam</span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Interactive Quick Inquiry Form */}
          <div className="lg:col-span-7">
            <ScrollReveal delay={100}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-card sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-xl font-bold text-zinc-900">Gửi yêu cầu hỗ trợ</h2>
                    <p className="mt-1 text-xs text-zinc-500">Điền thông tin bên dưới, chúng tôi sẽ phản hồi qua email/SĐT trong 24h.</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    Hỗ trợ 24/7
                  </span>
                </div>

                <ContactInquiryForm />
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mt-20">
          <ScrollReveal className="text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              Câu hỏi thường gặp (FAQ)
            </h2>
            <p className="mt-2 text-sm text-zinc-500">Giải đáp nhanh các thắc mắc phổ biến của người dùng</p>
          </ScrollReveal>

          <div className="mt-8 mx-auto max-w-3xl space-y-4">
            <FaqItem question="Trọ Ơi có thu phí người đi tìm phòng không?">
              Hoàn toàn <strong>không</strong>. Trọ Ơi cam kết miễn phí 100% cho người tìm phòng trọ. Bạn có thể tìm kiếm, lọc thông tin và lấy SĐT/Zalo liên hệ trực tiếp chủ trọ mà không tốn bất kỳ chi phí nào.
            </FaqItem>
            <FaqItem question="Quy trình kiểm duyệt tin đăng mất bao lâu?">
              Mọi tin đăng mới hoặc vừa cập nhật đều được kiểm duyệt trong vòng <strong>24 giờ làm việc</strong>. Sau khi đối soát địa chỉ và hình ảnh, tin sẽ được chuyển trạng thái sang Hoạt động.
            </FaqItem>
            <FaqItem question="Làm thế nào để báo cáo tin đăng có dấu hiệu lừa đảo?">
              Bạn có thể sử dụng biểu mẫu phía trên (chọn chủ đề &quot;Báo cáo tin đăng&quot;) hoặc gửi mail trực tiếp tới <a href="mailto:hotro@trooi.vn" className="text-brand-700 underline font-medium">hotro@trooi.vn</a> kèm link tin đăng. Đội ngũ sẽ tạm ẩn tin và xác minh ngay lập tức.
            </FaqItem>
            <FaqItem question="Chủ trọ muốn đăng tin thì cần chuẩn bị những gì?">
              Bạn chỉ cần tạo tài khoản, xác minh số điện thoại và cung cấp hình ảnh thực tế của phòng, địa chỉ chính xác kèm theo mức giá niêm yết rõ ràng.
            </FaqItem>
          </div>
        </section>
      </div>
    </div>
  );
}

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-zinc-200 bg-white shadow-xs [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between p-5 text-base font-semibold text-zinc-900 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
        {question}
        <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180 group-open:text-brand-600" />
      </summary>
      <div className="border-t border-zinc-100 p-5 pt-3 text-sm text-zinc-600 leading-relaxed">
        {children}
      </div>
    </details>
  );
}
