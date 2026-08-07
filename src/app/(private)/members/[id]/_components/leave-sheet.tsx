'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PauseCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmLeavesQueryKey,
  getCrmMembersByIdQueryKey,
  getCrmMembersQueryKey,
  postCrmMembersByIdSuspendMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { ProxyApplicationSection } from './proxy-application-section';

// ── Zod schema ────────────────────────────────────────────────────────────────
const leaveFormSchema = z
  .object({
    start_month: z.string().min(1, '休会開始月は必須です'),
    end_month: z.string().min(1, '休会終了月は必須です'),
    reason: z.string().optional(),
    is_proxy: z.boolean(),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .refine((data) => !data.is_proxy || !!data.proxy_agreed_at, {
    message: '合意日時は必須です',
    path: ['proxy_agreed_at'],
  })
  .refine((data) => !data.start_month || !data.end_month || data.end_month >= data.start_month, {
    message: '休会終了月は開始月以降を指定してください',
    path: ['end_month'],
  });

type LeaveFormValues = z.infer<typeof leaveFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface LeaveSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  hasUnpaidFee: boolean;
}

// ── LeaveSheet ────────────────────────────────────────────────────────────────
export function LeaveSheet({
  open,
  onOpenChange,
  memberId,
  hasUnpaidFee,
}: Readonly<LeaveSheetProps>) {
  const queryClient = useQueryClient();

  // Field state
  const [startMonth, setStartMonth] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [reason, setReason] = useState('');
  const [isProxy, setIsProxy] = useState(false);
  const [proxyAgreedAt, setProxyAgreedAt] = useState<Date | undefined>(undefined);
  const [proxyMethod, setProxyMethod] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveFormValues, string>>>({});

  const mutation = useMutation({
    ...postCrmMembersByIdSuspendMutation(),
    onSuccess: () => {
      toast.success('休会申請を受け付けました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey(), refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey(), refetchType: 'all' });
      handleClose();
    },
    onError: () => {
      toast.error('休会申請に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStartMonth('');
      setEndMonth('');
      setReason('');
      setIsProxy(false);
      setProxyAgreedAt(undefined);
      setProxyMethod('');
      setErrors({});
    }, 300);
  };

  const handleSubmit = () => {
    const values: LeaveFormValues = {
      start_month: startMonth,
      end_month: endMonth,
      reason: reason || undefined,
      is_proxy: isProxy,
      proxy_agreed_at: proxyAgreedAt ? proxyAgreedAt.toISOString() : undefined,
      proxy_method: proxyMethod || undefined,
    };

    const result = leaveFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LeaveFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LeaveFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    mutation.mutate({
      path: { id: memberId },
      body: result.data,
    });
  };

  const handleProxyAgreedAtChange = (date: Date | undefined) => {
    setProxyAgreedAt(date);
    if (date) setErrors((prev) => ({ ...prev, proxy_agreed_at: undefined }));
  };

  return (
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
              onIsProxyChange={setIsProxy}
              agreedAt={proxyAgreedAt}
              onAgreedAtChange={handleProxyAgreedAtChange}
              method={proxyMethod}
              onMethodChange={setProxyMethod}
              agreedAtError={errors.proxy_agreed_at}
            />
          </div>

          <Separator className="-mx-6 w-[calc(100%+48px)]" />

          {/* Month fields */}
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                休会開始月 <span className="text-destructive ml-1 text-xs">*</span>
              </Label>
              <MonthPicker
                value={startMonth}
                min={new Date().toISOString().slice(0, 7).replace('-', '/')} // current month or later
                onChange={(v) => {
                  setStartMonth(v);
                  setErrors((prev) => ({ ...prev, start_month: undefined }));
                }}
                hasError={!!errors.start_month}
              />
              {errors.start_month && (
                <p className="text-destructive text-xs">{errors.start_month}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                休会終了月 <span className="text-destructive ml-1 text-xs">*</span>
              </Label>
              <MonthPicker
                value={endMonth}
                min={startMonth || undefined}
                onChange={(v) => {
                  setEndMonth(v);
                  setErrors((prev) => ({ ...prev, end_month: undefined }));
                }}
                hasError={!!errors.end_month}
              />
              {errors.end_month && <p className="text-destructive text-xs">{errors.end_month}</p>}
            </div>

            {startMonth && endMonth && !errors.end_month && (
              <Alert className="border-info/20 bg-info/10">
                <AlertDescription className="text-info text-xs">
                  {startMonth} 〜 {endMonth} の期間、月額料金が休止されます。
                </AlertDescription>
              </Alert>
            )}
          </div>

          <Separator className="-mx-6 w-[calc(100%+48px)]" />

          {/* Reason */}
          <div className="flex flex-col gap-2 py-4">
            <Label htmlFor="leave-reason" className="text-sm font-medium">
              休会理由 <span className="text-muted-foreground ml-1 text-xs">任意</span>
            </Label>
            <Textarea
              id="leave-reason"
              rows={3}
              placeholder="例：産前産後のため"
              className="resize-none text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
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
          <Button
            className="flex-1"
            disabled={hasUnpaidFee || mutation.isPending}
            onClick={handleSubmit}
          >
            休会申請を送信
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
