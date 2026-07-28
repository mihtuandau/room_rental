import { AdminAccessGate } from '@/components/layout/admin-access-gate';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminTopbar } from '@/components/layout/admin-topbar';

/**
 * The proxy performs the coarse session-cookie redirect. This client-side gate
 * resolves the profile role for UX only; the NestJS RolesGuard remains the
 * authority for every admin API request.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAccessGate>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="min-w-0 flex-1 bg-[#f8f9ff]">
          <AdminTopbar />
          <main>{children}</main>
        </div>
      </div>
    </AdminAccessGate>
  );
}
