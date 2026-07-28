import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <SearchX className="h-12 w-12 text-zinc-400" aria-hidden />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Trang hoặc tin đăng bạn tìm có thể đã được gỡ bỏ hay không còn hiển thị.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/">Tìm phòng</Link>
        </Button>
      </div>
    </main>
  );
}
