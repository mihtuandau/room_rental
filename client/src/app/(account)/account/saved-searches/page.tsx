import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AuthRequired } from '@/components/auth/auth-required';
import { Button } from '@/components/ui/button';
import { PageContainer, PageHeader } from '@/components/layout/page-shell';
import { SavedSearchesView } from '@/features/saved-searches/saved-searches-view';

export const metadata: Metadata = {
  title: 'Tìm kiếm đã lưu',
  robots: { index: false, follow: false },
};

export default function SavedSearchesPage() {
  return (
    <PageContainer size="narrow" className="space-y-6">
      <PageHeader
        title="Tìm kiếm đã lưu"
        description="Quản lý điều kiện tìm phòng và trạng thái nhận thông báo."
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/account">
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Tài khoản
            </Link>
          </Button>
        }
      />
      <AuthRequired nextPath="/account/saved-searches">
        <SavedSearchesView />
      </AuthRequired>
    </PageContainer>
  );
}
