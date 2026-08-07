'use client';

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { MonthPicker } from '@/components/common/month-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  getCrmLeavesQueryKey,
  getCrmMembersByIdQueryKey,
  getCrmMembersByIdSuspensionLeaveOptions,
  getCrmMembersByIdSuspensionLeaveQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdSuspendReleaseMutation,
} from '@/lib/api/@tanstack/react-query.gen';

// ── Zod schema ────────────────────────────────────────────────────────────────
const leaveReleaseFormSchema = z.object({
  resume_month: z.string().min(1, '復帰月は必須です'),
});

type LeaveReleaseFormValues = z.infer<typeof leaveReleaseFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface LeaveReleaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
}

// ── LeaveReleaseSheet ─────────────────────────────────────────────────────────
export function LeaveReleaseSheet({
  open,
  onOpenChange,
  memberId,
}: Readonly<LeaveReleaseSheetProps>) {
  const queryClient = useQueryClient();

  const [resumeMonth, setResumeMonth] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveReleaseFormValues, string>>>({});

  // Fetch active suspension leave for this member
  const { data: suspensionData } = useQuery({
    ...getCrmMembersByIdSuspensionLeaveOptions({ path: { id: memberId } }),
    enabled: open,
  });

  const currentSuspension = suspensionData?.suspension ?? null;

  const mutation = useMutation({
    ...postCrmMembersByIdSuspendReleaseMutation(),
    onSuccess: () => {
      toast.success('休会を解除しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdSuspensionLeaveQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey(), refetchType: 'all' });
      handleClose();
    },
    onError: () => {
      toast.error('休会解除に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setResumeMonth('');
      setErrors({});
    }, 300);
  };

  const handleSubmit = () => {
    const result = leaveReleaseFormSchema.safeParse({ resume_month: resumeMonth });
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeaveReleaseFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LeaveReleaseFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    mutation.mutate({
      path: { id: memberId },
      body: { resume_month: result.data.resume_month },
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <PlayCircle className="size-4" />
              休会解除
            </SheetTitle>
            <SheetDescription className="text-muted-foreground mt-1 text-xs">
              休会中の会員の休会を解除します
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6">
          {/* Current suspension info */}
          <div className="flex flex-col gap-4 py-4">
            <p className="text-muted-foreground text-xs font-medium">現在の休会情報</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">休会開始月</p>
                <p className="text-sm font-medium">{currentSuspension?.scheduled_date ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">予定終了月</p>
                <p className="text-sm font-medium">{currentSuspension?.end_date ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1 text-xs">休会費用</p>
                <p className="text-sm font-medium">¥1,100/月</p>
              </div>
            </div>
          </div>

          <Separator className="-mx-6 w-[calc(100%+48px)]" />

          {/* Resume month picker */}
          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="leave-release-month" className="text-sm font-medium">
              復帰月 <span className="text-destructive ml-1 text-xs">*</span>
            </Label>
            <MonthPicker
              value={resumeMonth}
              onChange={(v) => {
                setResumeMonth(v);
                if (v) setErrors((prev) => ({ ...prev, resume_month: undefined }));
              }}
              min={currentSuspension?.scheduled_date ?? undefined}
              placeholder="年月を選択"
              hasError={!!errors.resume_month}
            />
            {errors.resume_month && (
              <p className="text-destructive text-xs">{errors.resume_month}</p>
            )}
            <p className="text-muted-foreground text-xs">選択した月の1日から課金が再開されます</p>
          </div>

          <Separator className="-mx-6 w-[calc(100%+48px)]" />

          {/* Info alert */}
          <div className="flex flex-col gap-4 py-4">
            <Alert className="border-info/20 bg-info/10">
              <AlertDescription className="text-info text-xs">
                復帰後は通常月額の請求が再開されます
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 gap-2 border-t px-6 py-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            キャンセル
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={mutation.isPending}>
            休会解除する
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
