import { Header } from '@/components/layout/header';
import { ManageSidebar } from '@/components/layout/manage-sidebar';

/**
 * "My listings" mode — any signed-in user, gated at the edge by middleware.ts
 * (coarse cookie check; the backend's 401/403 is the real authorisation).
 * Keeps the same Header as the public pages (it already renders the
 * "← Về trang tìm phòng" mode switch once the path starts with /manage) but
 * skips the public Footer — these are utility screens, not landing pages.
 * The sidebar is desktop-only (see ManageSidebar); on mobile each page's own
 * BackButton covers the "back to home search" action instead.
 */
export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="flex flex-1">
        <ManageSidebar />
        <main className="min-w-0 flex-1 bg-zinc-50">{children}</main>
      </div>
    </>
  );
}
