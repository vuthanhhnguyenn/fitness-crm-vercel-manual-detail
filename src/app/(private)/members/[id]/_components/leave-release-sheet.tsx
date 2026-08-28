'use client';

import { useForm } from 'react-hook-form';

import { formatYen } from '@/utils/format.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { MonthPicker } from '@/components/common/month-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

import {
  PICKER_YEAR_MONTH_PATTERN,
  currentYearMonth,
  diffYearMonths,
  toApiYearMonth,
} from '../_utils/month-range';

// ── Zod schema ────────────────────────────────────────────────────────────────
const leaveReleaseFormSchema = z.object({
  resume_month: z
    .string()
    .regex(PICKER_YEAR_MONTH_PATTERN, '復帰月は必須です')
    // Q3: releasing shortens the active suspension, so a retroactive resume month is
    // unsupported — it would require an invoice correction in F-01.
    .refine((v) => diffYearMonths(v, currentYearMonth()) >= 0, {
      message: '復帰月は今月以降を指定してください',
    }),
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
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<LeaveReleaseFormValues>({
    resolver: zodResolver(leaveReleaseFormSchema),
    mode: 'onSubmit',
    defaultValues: { resume_month: '' },
  });

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
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('休会解除に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset({ resume_month: '' });
    }, 300);
  };

  // The sheet body scrolls, so `scrollToFirstError` brings the first invalid field into view
  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      // MonthPicker gives `YYYY/MM`; the API contract is `YYYY-MM`
      body: { resume_month: toApiYearMonth(data.resume_month) },
    });
  }, scrollToFirstError);

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
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6">
              {/* Current suspension info */}
              <div className="flex flex-col gap-4 py-4">
                <p className="text-muted-foreground text-xs font-medium">現在の休会情報</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">休会開始月</p>
                    <p className="text-sm font-medium">
                      {currentSuspension?.scheduled_date ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">予定終了月</p>
                    <p className="text-sm font-medium">{currentSuspension?.end_date ?? '—'}</p>
                  </div>
                  {currentSuspension?.suspension_fee != null && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-xs">休会費用</p>
                      <p className="text-sm font-medium">
                        {formatYen(currentSuspension.suspension_fee)}/月
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Resume month picker */}
              <FormField
                control={form.control}
                name="resume_month"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col gap-2 py-4">
                    <FormLabel htmlFor="leave-release-month" className="text-sm font-medium">
                      復帰月 <span className="text-destructive ml-1 text-xs">*</span>
                    </FormLabel>
                    <MonthPicker
                      value={field.value}
                      onChange={field.onChange}
                      // The suspension row already carries the picker's `YYYY/MM` format
                      min={currentSuspension?.scheduled_date ?? undefined}
                      placeholder="年月を選択"
                      hasError={!!fieldState.error}
                    />
                    <FormMessage />
                    <p className="text-muted-foreground text-xs">
                      選択した月の1日から課金が再開されます
                    </p>
                  </FormItem>
                )}
              />

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
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                キャンセル
              </Button>
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                休会解除する
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
