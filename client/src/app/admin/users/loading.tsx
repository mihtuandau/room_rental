import { PageContainer } from '@/components/layout/page-shell';
import { UsersSkeleton } from './_components/users-skeleton';

export default function AdminUsersLoading() {
  return (
    <PageContainer>
      <UsersSkeleton />
    </PageContainer>
  );
}
