'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  getCrmMembersByIdQueryKey,
  postCrmMembersByIdWithdrawMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { WithdrawReason } from '@/lib/api/types.gen';

import { ProxyApplicationSection } from './proxy-application-section';

// ── WITHDRAW REASON OPTIONS─────────────────────────────────────────────────────────────────
const WITHDRAW_REASON_OPTIONS: { value: WithdrawReason; label: string }[] = [
  { value: WithdrawReason.RELOCATION, label: '転居' },
  { value: WithdrawReason.INCONVENIENT_ACCESS, label: '通いにくくなった' },
  { value: WithdrawReason.COST, label: '料金' },
  { value: WithdrawReason.HEALTH_REASON, label: '健康上の理由' },
  { value: WithdrawReason.CANCELLATION_BEFORE_USE, label: '入会取り消し（利用開始前）' },
  { value: WithdrawReason.OTHER, label: 'その他' },
];

// ── Zod form schema ───────────────────────────────────────────────────────────
const withdrawFormSchema = z
  .object({
    scheduled_date: z.string().min(1, '退会予定日は必須です'),
    reason: z.nativeEnum(WithdrawReason, { message: '退会理由は必須です' }),
    reason_detail: z.string().optional(),
    is_proxy: z.boolean(),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.is_proxy && !data.proxy_agreed_at) return false;
      return true;
    },
    { message: '合意日時は必須です', path: ['proxy_agreed_at'] },
  );

type WithdrawFormValues = z.infer<typeof withdrawFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface WithdrawSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
}

// ── WithdrawSheet ─────────────────────────────────────────────────────────────
export function WithdrawSheet({ open, onOpenChange, memberId }: Readonly<WithdrawSheetProps>) {
  const queryClient = useQueryClient();

  // Local state for fields that drive conditional UI — avoids form.watch() React Compiler issues
  const [isProxy, setIsProxy] = useState(false);
  const [reason, setReason] = useState<WithdrawReason | undefined>(undefined);
  const [scheduledDateObj, setScheduledDateObj] = useState<Date | undefined>(undefined);
  const [proxyAgreedAtDate, setProxyAgreedAtDate] = useState<Date | undefined>(undefined);
  const [proxyMethod, setProxyMethod] = useState('');

  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawFormSchema),
    defaultValues: {
      scheduled_date: '',
      reason: undefined,
      reason_detail: '',
      is_proxy: false,
      proxy_agreed_at: '',
      proxy_method: '',
    },
  });

  const mutation = useMutation({
    ...postCrmMembersByIdWithdrawMutation(),
    onSuccess: () => {
      toast.success('退会申請を受け付けました');
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      handleClose();
    },
    onError: () => {
      toast.error('退会申請に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset();
      setIsProxy(false);
      setReason(undefined);
      setScheduledDateObj(undefined);
      setProxyAgreedAtDate(undefined);
      setProxyMethod('');
    }, 300);
  };

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      body: {
        scheduled_date: data.scheduled_date,
        reason: data.reason,
        reason_detail: data.reason_detail || undefined,
        is_proxy: data.is_proxy,
        proxy_agreed_at: data.is_proxy ? data.proxy_agreed_at : undefined,
        proxy_method: data.is_proxy && proxyMethod ? proxyMethod : undefined,
      },
    });
  });

  const handleIsProxyChange = (v: boolean) => {
    setIsProxy(v);
    form.setValue('is_proxy', v);
    if (!v) {
      setProxyAgreedAtDate(undefined);
      setProxyMethod('');
      form.setValue('proxy_agreed_at', '');
      form.setValue('proxy_method', '');
    }
  };

  const handleProxyAgreedAtChange = (date: Date | undefined) => {
    setProxyAgreedAtDate(date);
    form.setValue('proxy_agreed_at', date ? date.toISOString() : '', {
      shouldValidate: true,
    });
  };

  const handleProxyMethodChange = (v: string) => {
    setProxyMethod(v);
    form.setValue('proxy_method', v);
  };

  const scheduledDateFormatted = scheduledDateObj
    ? format(scheduledDateObj, 'yyyy/MM/dd')
    : undefined;

  return (
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
                  method={proxyMethod}
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
                          onDateChange={(date) => {
                            setScheduledDateObj(date);
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                          }}
                        />
                      </FormControl>
                      {scheduledDateFormatted && (
                        <Alert className="border-info/20 bg-info/10 mt-1">
                          <AlertDescription className="text-info text-xs">
                            {scheduledDateFormatted} 付で退会処理されます。
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reason */}
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        退会理由 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => {
                          const val = v as WithdrawReason;
                          field.onChange(val);
                          setReason(val);
                        }}
                        items={WITHDRAW_REASON_OPTIONS}
                      >
                        <FormControl>
                          <SelectTrigger id="retire-reason" className="h-9 text-sm">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WITHDRAW_REASON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {reason === WithdrawReason.CANCELLATION_BEFORE_USE && (
                        <Alert className="border-info/20 bg-info/10 mt-1">
                          <AlertDescription className="text-info text-xs">
                            この操作は利用開始日前の会員のみ選択可能です
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Detail — shown only when reason is OTHER */}
                {reason === WithdrawReason.OTHER && (
                  <FormField
                    control={form.control}
                    name="reason_detail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">詳細</FormLabel>
                        <FormControl>
                          <Textarea
                            id="retire-other"
                            rows={3}
                            className="resize-none text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
  );
}
