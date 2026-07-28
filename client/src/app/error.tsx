'use client';

import { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Keep diagnostics in the browser console without exposing implementation
    // details to people using the site.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <RefreshCw className="h-12 w-12 text-zinc-400" aria-hidden />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Không thể tải trang</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Có thể kết nối đang gặp sự cố. Bạn hãy thử lại nhé.
        </p>
        <Button className="mt-6" onClick={reset}>
          Thử lại
        </Button>
      </div>
    </main>
  );
}
