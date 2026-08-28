'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { useAuthUser } from '@/contexts/auth-user.context';
import { formatDateYYYYMM } from '@/utils/date.util';
import { formatYen } from '@/utils/format.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PauseCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { MonthPicker } from '@/components/common/month-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import {
  getCrmLeavesQueryKey,
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdSuspendMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { GetMemberDetailResponse, ProxyAgreementMethod } from '@/lib/api/types.gen';

import { UserRole } from '@/types/permission.type';

import {
  PICKER_YEAR_MONTH_PATTERN,
  currentYearMonth,
  diffYearMonths,
  toApiYearMonth,
} from '../_utils/month-range';
import { ProxyApplicationSection } from './proxy-application-section';

const SUSPENSION_MAX_MONTHS = 12;

// ── Zod schema ────────────────────────────────────────────────────────────────
const leaveFormSchema = z
  .object({
    start_month: z.string().regex(PICKER_YEAR_MONTH_PATTERN, '休会開始月は必須です'),
    end_month: z.string().regex(PICKER_YEAR_MONTH_PATTERN, '休会終了月は必須です'),
    reason: z.string().optional(),
    // FR-S001: manual refund of the point-based discount; a refund reason is required when refunding
    return_points: z.boolean(),
    return_reason: z.string().optional(),
    is_proxy: z.boolean(),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .refine((data) => !data.is_proxy || !!data.proxy_agreed_at, {
    message: '合意日時は必須です',
    path: ['proxy_agreed_at'],
  })
  // BR-SUS-001 at month granularity. Months are inclusive, so start === end is a valid
  // one-month suspension and the span counts the start month itself.
  .refine(
    (data) => !data.start_month || diffYearMonths(data.start_month, currentYearMonth()) >= 0,
    { message: '休会開始月は今月以降を指定してください', path: ['start_month'] },
  )
  .refine((data) => !data.start_month || !data.end_month || data.end_month >= data.start_month, {
    message: '休会終了月は開始月以降を指定してください',
    path: ['end_month'],
  })
  .refine(
    (data) =>
      !data.start_month ||
      !data.end_month ||
      diffYearMonths(data.end_month, data.start_month) + 1 <= SUSPENSION_MAX_MONTHS,
    { message: `休会期間は最長${SUSPENSION_MAX_MONTHS}ヶ月です`, path: ['end_month'] },
  )
  .refine((data) => !data.return_points || !!data.return_reason?.trim(), {
    message: '返還事由は必須です',
    path: ['return_reason'],
  });

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

const DEFAULT_VALUES: LeaveFormValues = {
  start_month: '',
  end_month: '',
  reason: '',
  return_points: false,
  return_reason: '',
  is_proxy: false,
  proxy_agreed_at: undefined,
  proxy_method: '',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface LeaveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  hasUnpaidFee: boolean;
  /** Active individual fee adjustment (FR-S001: shown in the discount confirmation on suspension) */
  activeFeeAdjustment?: ActiveFeeAdjustment | null;
  /** Active point-based discount (FR-S001: target of the manual refund) */
  activePointDiscount?: ActivePointDiscount | null;
}

type ActiveFeeAdjustment = NonNullable<
  NonNullable<GetMemberDetailResponse['currentMainContract']>['activeFeeAdjustment']
>;
type ActivePointDiscount = NonNullable<
  NonNullable<GetMemberDetailResponse['currentMainContract']>['activePointDiscount']
>;

// FR-S001: manual point refund requires Manager or above
const POINT_RETURN_ROLES = [UserRole.System, UserRole.Headquarter, UserRole.Manager] as const;

// ── LeaveSheet ────────────────────────────────────────────────────────────────
export function LeaveSheet({
  open,
  onOpenChange,
  memberId,
  hasUnpaidFee,
  activeFeeAdjustment,
  activePointDiscount,
}: Readonly<LeaveSheetProps>) {
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const { hasRole } = useAuthUser();
  const canManualPointReturn = hasRole(POINT_RETURN_ROLES);

  // FR-014: 申請 operations must be confirmed before they are sent
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveFormSchema),
    mode: 'onSubmit',
    defaultValues: DEFAULT_VALUES,
  });

  const startMonth = useWatch({ control: form.control, name: 'start_month' });
  const endMonth = useWatch({ control: form.control, name: 'end_month' });
  // FR-S001: the refund is the monthly point discount × number of suspended months (inclusive)
  const suspendedMonths =
    startMonth && endMonth ? Math.max(1, diffYearMonths(endMonth, startMonth) + 1) : 0;
  const returnPoints = useWatch({ control: form.control, name: 'return_points' });
  const isProxy = useWatch({ control: form.control, name: 'is_proxy' });
  const proxyAgreedAt = useWatch({ control: form.control, name: 'proxy_agreed_at' });
  const proxyMethod = useWatch({ control: form.control, name: 'proxy_method' });

  const mutation = useMutation({
    ...postCrmMembersByIdSuspendMutation(),
    onSuccess: () => {
      toast.success('休会申請を受け付けました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('休会申請に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset(DEFAULT_VALUES);
    }, 300);
  };

  // Validate first, then ask for confirmation; the mutation only runs from the dialog.
  const handleSubmit = form.handleSubmit(() => {
    setShowConfirm(true);
  }, scrollToFirstError);

  const handleConfirm = () => {
    setShowConfirm(false);
    const data = form.getValues();
    mutation.mutate({
      path: { id: memberId },
      body: {
        // MonthPicker gives `YYYY/MM`; the API contract is `YYYY-MM`
        start_month: toApiYearMonth(data.start_month),
        end_month: toApiYearMonth(data.end_month),
        reason: data.reason || undefined,
        return_points: data.return_points,
        return_reason: data.return_points ? data.return_reason : undefined,
        is_proxy: data.is_proxy,
        proxy_agreed_at: data.proxy_agreed_at,
        proxy_method: (data.proxy_method || undefined) as ProxyAgreementMethod | undefined,
      },
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
          {/* Header */}
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <PauseCircle className="size-4" />
                休会申請
              </SheetTitle>
              <SheetDescription className="sr-only">休会申請フォーム</SheetDescription>
            </SheetHeader>
          </div>

          {/* Body */}
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6">
                {/* Unpaid fee warning */}
                {hasUnpaidFee && (
                  <div className="pt-4">
                    <Alert className="border-destructive/30 bg-destructive/10">
                      <AlertDescription className="text-destructive text-xs">
                        未納金が発生しています。休会申請前に未納金の解消が必要です。
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Proxy section */}
                <div className="py-4">
                  <ProxyApplicationSection
                    isProxy={isProxy}
                    onIsProxyChange={(v) => form.setValue('is_proxy', v)}
                    agreedAt={proxyAgreedAt ? new Date(proxyAgreedAt) : undefined}
                    onAgreedAtChange={(date) => {
                      form.setValue('proxy_agreed_at', date ? date.toISOString() : undefined);
                      if (date) form.clearErrors('proxy_agreed_at');
                    }}
                    method={(proxyMethod ?? '') as ProxyAgreementMethod | ''}
                    onMethodChange={(v) => form.setValue('proxy_method', v)}
                    agreedAtError={form.formState.errors.proxy_agreed_at?.message}
                  />
                </div>

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                {/* Month fields */}
                <div className="flex flex-col gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="start_month"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          休会開始月 <span className="text-destructive ml-1 text-xs">*</span>
                        </FormLabel>
                        <MonthPicker
                          value={field.value}
                          min={formatDateYYYYMM(new Date())}
                          onChange={field.onChange}
                          hasError={!!fieldState.error}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_month"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          休会終了月 <span className="text-destructive ml-1 text-xs">*</span>
                        </FormLabel>
                        <MonthPicker
                          value={field.value}
                          min={startMonth || undefined}
                          onChange={field.onChange}
                          hasError={!!fieldState.error}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {startMonth && endMonth && !form.formState.errors.end_month && (
                    <Alert className="border-info/20 bg-info/10">
                      <AlertDescription className="text-info text-xs">
                        {startMonth} 〜 {endMonth} の期間、月額料金が休止されます。
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* FR-S001: active discount confirmation + manual point refund (Manager+) */}
                {(activeFeeAdjustment || activePointDiscount) && (
                  <>
                    <Separator className="-mx-6 w-[calc(100%+48px)]" />
                    <div className="flex flex-col gap-3 py-4">
                      <p className="text-sm font-medium">適用中の値引き確認</p>
                      <Alert className="border-warning/20 bg-warning/15">
                        <AlertDescription className="text-warning flex flex-col gap-2 text-xs">
                          <span>この会員には現在、以下の値引きが適用されています:</span>
                          <ul className="list-inside list-disc space-y-1">
                            {activeFeeAdjustment && (
                              <li>
                                個別会費調整: {formatYen(activeFeeAdjustment.adjustedMonthlyFee)}/月
                                {activeFeeAdjustment.reason
                                  ? `（${activeFeeAdjustment.reason}）`
                                  : ''}
                              </li>
                            )}
                            {activePointDiscount && (
                              <li>
                                ポイント値引き: 月額 {formatYen(activePointDiscount.monthlyAmount)}{' '}
                                相当（{activePointDiscount.pointName}）
                              </li>
                            )}
                          </ul>
                        </AlertDescription>
                      </Alert>
                      {activePointDiscount && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger render={<span className="block" />}>
                                <div
                                  className={`flex items-start gap-2 rounded-md border px-4 py-3 ${
                                    !canManualPointReturn ? 'opacity-50' : ''
                                  }`}
                                >
                                  <Checkbox
                                    id="leave-point-return"
                                    checked={returnPoints}
                                    disabled={!canManualPointReturn}
                                    onCheckedChange={(v) => {
                                      if (!canManualPointReturn) return;
                                      form.setValue('return_points', v === true);
                                      form.clearErrors('return_reason');
                                    }}
                                  />
                                  <Label
                                    htmlFor="leave-point-return"
                                    className={`text-sm leading-snug ${
                                      canManualPointReturn ? 'cursor-pointer' : 'cursor-not-allowed'
                                    }`}
                                  >
                                    ポイント値引き分（{formatYen(activePointDiscount.monthlyAmount)}
                                    相当）を返還する
                                  </Label>
                                </div>
                              </TooltipTrigger>
                              {!canManualPointReturn && (
                                <TooltipContent>
                                  <p className="text-xs">
                                    ポイント手動返還はManager以上の権限が必要です
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {returnPoints && canManualPointReturn && (
                            <FormField
                              control={form.control}
                              name="return_reason"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium">
                                    返還事由{' '}
                                    <span className="text-destructive ml-1 text-xs">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Textarea
                                      maxLength={TEXTAREA_MAX_LENGTH}
                                      rows={2}
                                      placeholder="例：休会期間中のポイント値引き分を返還"
                                      className="resize-none text-sm"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                  <p className="text-muted-foreground text-xs">
                                    {suspendedMonths > 0 ? (
                                      <>
                                        返還予定額:{' '}
                                        {formatYen(
                                          activePointDiscount.monthlyAmount * suspendedMonths,
                                        )}
                                        （休会{suspendedMonths}ヶ月 ×{' '}
                                        {formatYen(activePointDiscount.monthlyAmount)}）
                                      </>
                                    ) : (
                                      '返還予定額: 休会期間を選択すると表示されます'
                                    )}
                                  </p>
                                </FormItem>
                              )}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 py-4">
                      <FormLabel className="text-sm font-medium">
                        休会理由 <span className="text-muted-foreground ml-1 text-xs">任意</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          maxLength={TEXTAREA_MAX_LENGTH}
                          rows={3}
                          placeholder="例：産前産後のため"
                          className="resize-none text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={hasUnpaidFee || mutation.isPending}
                >
                  休会申請を送信
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Confirm AlertDialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>休会申請を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {startMonth} 〜 {endMonth} の期間、月額料金が休止されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirm(false);
              }}
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>送信する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
