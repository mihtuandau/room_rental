import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer } from '@/components/layout/page-shell';

export default function Loading() {
  return (
    <PageContainer>
      <Skeleton className="h-8 w-52" />
      <Skeleton className="mt-3 h-5 w-full max-w-md" />
      <Skeleton className="mt-8 h-44 w-full rounded-lg" />
    </PageContainer>
  );
}
