import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { FloatingLandlordBadge } from '@/components/layout/floating-landlord-badge';

/**
 * Chrome for the public, SEO-critical pages. `(auth)` gets its own bare layout
 * later — a sign-in screen with a "Đăng tin" button in the header is noise.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-surface-page">{children}</main>
      <FloatingLandlordBadge />
      <Footer />
    </>
  );
}
