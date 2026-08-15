'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ContactInquiryForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {submitted ? (
        <p
          role="status"
          className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-800"
        >
          Cảm ơn bạn! Yêu cầu đã được ghi nhận, đội ngũ Trọ Ơi sẽ liên hệ lại sớm nhất.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contactName" className="block text-xs font-semibold text-zinc-700">
            Họ và tên *
          </label>
          <Input
            id="contactName"
            name="name"
            required
            placeholder="Nguyễn Văn A"
            className="mt-1.5 h-11 text-sm"
          />
        </div>
        <div>
          <label htmlFor="contactIdentifier" className="block text-xs font-semibold text-zinc-700">
            Số điện thoại hoặc Email *
          </label>
          <Input
            id="contactIdentifier"
            name="identifier"
            required
            placeholder="0901234567 hoặc email@domain.com"
            className="mt-1.5 h-11 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contactSubject" className="block text-xs font-semibold text-zinc-700">
          Chủ đề cần hỗ trợ
        </label>
        <select
          id="contactSubject"
          name="subject"
          className="mt-1.5 h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
        >
          <option value="report">Báo cáo tin đăng sai sự thật / lừa đảo</option>
          <option value="landlord">Hỗ trợ chủ trọ đăng tin & xác minh</option>
          <option value="account">Vấn đề tài khoản & bảo mật</option>
          <option value="other">Thắc mắc khác</option>
        </select>
      </div>

      <div>
        <label htmlFor="contactMessage" className="block text-xs font-semibold text-zinc-700">
          Nội dung chi tiết *
        </label>
        <textarea
          id="contactMessage"
          name="message"
          required
          rows={4}
          placeholder="Mô tả cụ thể thắc mắc hoặc kèm theo link tin đăng cần báo cáo..."
          className="mt-1.5 w-full rounded-md border border-zinc-300 bg-white p-3 text-sm text-zinc-900 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
      </div>

      <Button type="submit" size="lg" className="w-full sm:w-auto">
        <Send className="h-4 w-4" aria-hidden />
        Gửi yêu cầu ngay
      </Button>
    </form>
  );
}
