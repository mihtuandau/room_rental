'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <main>
          <h1>Không thể tải trang</h1>
          <p>Có thể kết nối đang gặp sự cố. Bạn hãy thử lại nhé.</p>
          <button type="button" onClick={reset}>
            Thử lại
          </button>
        </main>
      </body>
    </html>
  );
}
