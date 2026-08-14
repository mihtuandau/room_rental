'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="flex max-w-lg flex-col items-center text-center">
        {/* Decorative icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 shadow-card">
          <WifiOff className="h-7 w-7" aria-hidden />
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Không thể tải trang
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600">
          Có thể kết nối đang gặp sự cố hoặc máy chủ tạm thời không phản hồi. Bạn hãy thử lại nhé.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Thử lại
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
