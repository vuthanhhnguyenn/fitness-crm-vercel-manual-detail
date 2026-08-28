'use client';

import { useMemo, useState } from 'react';
import { type DefaultValues, useForm, useWatch } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parse, startOfToday } from 'date-fns';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

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
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
  postCrmMembersByIdWithdrawMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { ProxyAgreementMethod } from '@/lib/api/types.gen';

import {
  type WithdrawFormValues,
  buildWithdrawFormSchema,
  deriveWithdrawalType,
} from '../_schemas/withdraw-form.schema';
import { ProxyApplicationSection } from './proxy-application-section';

const DEFAULT_VALUES: DefaultValues<WithdrawFormValues> = {
  scheduled_date: '',
  reason: '',
  is_proxy: false,
  proxy_agreed_at: '',
  proxy_method: '',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface WithdrawSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  /** Display name of the member — rendered verbatim in the confirmation dialog */
  memberName: string;
  /**
   * Contract usage start date. Drives the derived withdrawal type (FR-014): a date before
   * it makes this an 入会取消, otherwise a 通常退会 subject to the 7-day minimum.
   */
  usageStartDate?: string;
}

// ── WithdrawSheet ─────────────────────────────────────────────────────────────
export function WithdrawSheet({
  open,
  onOpenChange,
  memberId,
  memberName,
  usageStartDate,
}: Readonly<WithdrawSheetProps>) {
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  // FR-014: 申請 operations must be confirmed before they are sent
  const [showConfirm, setShowConfirm] = useState(false);

  const formSchema = useMemo(() => buildWithdrawFormSchema(usageStartDate), [usageStartDate]);

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  // RHF is the single source of truth; useWatch drives the conditional UI
  const isProxy = useWatch({ control: form.control, name: 'is_proxy' });
  const scheduledDate = useWatch({ control: form.control, name: 'scheduled_date' });
  const proxyAgreedAt = useWatch({ control: form.control, name: 'proxy_agreed_at' });
  const proxyMethod = useWatch({ control: form.control, name: 'proxy_method' });

  const scheduledDateObj = useMemo(
    () => (scheduledDate ? parse(scheduledDate, 'yyyy-MM-dd', new Date()) : undefined),
    [scheduledDate],
  );
  const proxyAgreedAtDate = useMemo(
    () => (proxyAgreedAt ? new Date(proxyAgreedAt) : undefined),
    [proxyAgreedAt],
  );

  const mutation = useMutation({
    ...postCrmMembersByIdWithdrawMutation(),
    onSuccess: () => {
      toast.success('退会申請を受け付けました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMembersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getCrmLeavesQueryKey() });
      handleClose();
    },
    onError: () => {
      toast.error('退会申請に失敗しました');
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
        scheduled_date: data.scheduled_date,
        reason: data.reason,
        withdrawal_type: deriveWithdrawalType(data.scheduled_date, usageStartDate),
        is_proxy: data.is_proxy,
        proxy_agreed_at: data.is_proxy ? data.proxy_agreed_at : undefined,
        proxy_method:
          data.is_proxy && data.proxy_method
            ? (data.proxy_method as ProxyAgreementMethod)
            : undefined,
      },
    });
  };

  const handleIsProxyChange = (v: boolean) => {
    form.setValue('is_proxy', v);
    if (!v) {
      form.setValue('proxy_agreed_at', '');
      form.setValue('proxy_method', '');
      form.clearErrors('proxy_agreed_at');
    }
  };

  const handleProxyAgreedAtChange = (date: Date | undefined) => {
    form.setValue('proxy_agreed_at', date ? date.toISOString() : '', {
      shouldValidate: true,
    });
  };

  const handleProxyMethodChange = (v: string) => {
    form.setValue('proxy_method', v);
  };

  const scheduledDateFormatted = scheduledDateObj
    ? format(scheduledDateObj, 'yyyy/MM/dd')
    : undefined;

  // Surfaced to the operator so the derived type (FR-014) is never a silent decision
  const derivedType = deriveWithdrawalType(scheduledDate, usageStartDate);

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
          {/* Header */}
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <LogOut className="size-4" />
                退会申請
              </SheetTitle>
              <SheetDescription className="sr-only">退会申請フォーム</SheetDescription>
            </SheetHeader>
          </div>

          {/* Body */}
          <Form {...form}>
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto px-6">
                {/* Proxy section */}
                <div className="py-4">
                  <ProxyApplicationSection
                    isProxy={isProxy}
                    onIsProxyChange={handleIsProxyChange}
                    agreedAt={proxyAgreedAtDate}
                    onAgreedAtChange={handleProxyAgreedAtChange}
                    method={(proxyMethod ?? '') as ProxyAgreementMethod | ''}
                    onMethodChange={handleProxyMethodChange}
                    agreedAtError={form.formState.errors.proxy_agreed_at?.message}
                  />
                </div>

                <Separator className="-mx-6 w-[calc(100%+48px)]" />

                {/* Main fields */}
                <div className="flex flex-col gap-4 py-4">
                  {/* Scheduled date */}
                  <FormField
                    control={form.control}
                    name="scheduled_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          退会予定日 <span className="text-destructive ml-1 text-xs">*</span>
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={scheduledDateObj}
                            placeholder="日付を選択"
                            hasError={!!form.formState.errors.scheduled_date}
                            // 退会予定日 is always in the future — a past date cannot be scheduled
                            disabledDate={{ before: startOfToday() }}
                            onDateChange={(date) => {
                              field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                            }}
                          />
                        </FormControl>
                        {scheduledDateFormatted && (
                          <Alert className="border-info/20 bg-info/10 mt-1">
                            <AlertDescription className="text-info text-xs">
                              {scheduledDateFormatted} 付で
                              {derivedType === 'cancellation' ? '入会取り消し' : '退会処理'}
                              されます。
                              {derivedType === 'cancellation' &&
                                '（利用開始日前のため入会取り消しとして登録されます）'}
                            </AlertDescription>
                          </Alert>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Reason — FR-014: a single free-text field, matching the prototype */}
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          退会理由 <span className="text-destructive ml-1 text-xs">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            id="retire-reason"
                            rows={3}
                            maxLength={TEXTAREA_MAX_LENGTH}
                            placeholder="例：転居のため"
                            className="resize-none text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="-mx-6 w-[calc(100%+48px)]" />
                <div className="py-2" />
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
                  退会申請を送信
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
            <AlertDialogTitle>退会申請を確定しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {memberName} さんの退会予定が登録されます。この操作は取り消しに別途手続きが必要です。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirm(false);
              }}
            >
              戻る
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirm}
            >
              確定する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
