'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REPORT_REASON_LABELS } from '@/lib/constants';
import { ApiError } from '@/lib/api-client';
import { useIsSignedIn } from '@/stores/auth-store';
import { useCreateReport } from '@/features/reports/hooks';
import { reportSchema, type ReportInput } from '@/features/reports/schemas';

export function ReportDialog({
  roomId,
  roomSlug,
  variant = 'button',
}: {
  roomId: number;
  roomSlug: string;
  /** 'link' is the quiet bottom-of-page style ("Report this listing"); 'button' is a normal ghost button. */
  variant?: 'button' | 'link';
}) {
  const router = useRouter();
  const isSignedIn = useIsSignedIn();
  const [open, setOpen] = useState(false);
  const createReport = useCreateReport(roomId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportInput>({ resolver: zodResolver(reportSchema) });

  const onOpenChange = (next: boolean) => {
    if (next && !isSignedIn) {
      router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
      return;
    }
    setOpen(next);
    if (!next) reset();
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createReport.mutateAsync(values);
      toast.success('Đã gửi báo cáo. Cảm ơn bạn.');
      setOpen(false);
      reset();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/room/${roomSlug}`)}`);
      } else {
        toast.error('Không gửi được báo cáo, thử lại sau.');
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {variant === 'link' ? (
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-2 rounded-md text-sm text-zinc-600 transition-colors hover:text-zinc-900',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2',
            )}
          >
            <Flag className="h-4 w-4" aria-hidden />
            Báo cáo tin đăng sai thông tin hoặc lừa đảo
          </button>
        ) : (
          <Button variant="ghost" size="sm">
            <Flag className="h-4 w-4" aria-hidden />
            Báo cáo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo cáo tin đăng</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate>
          <DialogBody className="space-y-4">
            <div>
              <label htmlFor="reason" className="mb-1 block text-sm font-medium">
                Lý do
              </label>
              <Controller
                name="reason"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="reason" className="w-full">
                      <SelectValue placeholder="Chọn lý do" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REPORT_REASON_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-danger-600">{errors.reason.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-medium">
                Mô tả thêm (không bắt buộc)
              </label>
              <Textarea
                id="description"
                placeholder="Cho chúng tôi biết thêm chi tiết…"
                error={!!errors.description}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-danger-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang gửi…' : 'Gửi báo cáo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
