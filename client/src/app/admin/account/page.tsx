import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { PageContainer } from "@/components/layout/page-shell";
import { AccountView } from "@/features/users/account-view";

export const metadata: Metadata = {
  title: "Tài khoản quản trị",
  robots: { index: false, follow: false },
};

export default function AdminAccountPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <AdminPageHeader
          title="Tài khoản cá nhân"
          description="Cập nhật ảnh đại diện và thông tin liên hệ của bạn."
        />
        <section className="max-w-2xl rounded-lg border border-zinc-200 bg-white p-4 sm:p-5">
          <AccountView showLogout={false} />
        </section>
      </div>
    </PageContainer>
  );
}
