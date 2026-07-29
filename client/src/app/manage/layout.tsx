import { Header } from '@/components/layout/header';
import { ManageShell } from '@/components/layout/manage-shell';

/**
 * "My listings" mode — any signed-in user, gated at the edge by middleware.ts
 * (coarse cookie check; the backend's 401/403 is the real authorisation).
 * Keeps the same Header as the public pages (it already renders the
 * "← Về trang tìm phòng" mode switch once the path starts with /manage) but
 * skips the public Footer — these are utility screens, not landing pages.
 * The listing-management sidebar is desktop-only and intentionally omitted
 * from the personal account page.
 */
export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <ManageShell>{children}</ManageShell>
    </>
  );
}
