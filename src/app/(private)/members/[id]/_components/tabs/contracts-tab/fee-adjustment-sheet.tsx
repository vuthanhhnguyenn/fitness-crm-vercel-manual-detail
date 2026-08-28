'use client';

import { type DefaultValues, useForm, useWatch } from 'react-hook-form';

import { formatDateYYYYMM } from '@/utils/date.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { MonthPicker } from '@/components/common/month-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
  getCrmMembersByIdFeeAdjustmentsQueryKey,
  getCrmMembersByIdQueryKey,
  postCrmMembersByIdFeeAdjustmentsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { ProxyAgreementMethod } from '@/lib/api/types.gen';

import { PICKER_YEAR_MONTH_PATTERN, toApiYearMonth } from '../../../_utils/month-range';
import { ProxyApplicationSection } from '../../proxy-application-section';

// ── Pattern options ─────────────────────────────────────────────────────────
const FEE_ADJUSTMENT_PATTERNS = [
  { value: 'amount', label: '金額指定' },
  { value: 'discount_amount', label: '値引き額指定' },
  { value: 'discount_rate', label: '割引率指定' },
  { value: 'markup_amount', label: '値増し額指定' },
] as const;

type FeeAdjustmentPattern = (typeof FEE_ADJUSTMENT_PATTERNS)[number]['value'];

// ── Zod schema ──────────────────────────────────────────────────────────────
// A-01 FR-006: period (start/end month), amount and adjustment reason are all required (audit trail)
const feeAdjustmentFormSchema = z
  .object({
    start_month: z.string().regex(PICKER_YEAR_MONTH_PATTERN, '開始月は必須です'),
    end_month: z.string().regex(PICKER_YEAR_MONTH_PATTERN, '終了月は必須です'),
    pattern: z.enum(['amount', 'discount_amount', 'discount_rate', 'markup_amount'], {
      message: 'パターンは必須です',
    }),
    value: z.coerce
      .number({ message: '金額 / 率は必須です' })
      .positive('金額 / 率を入力してください'),
    reason: z.string().trim().min(1, '事由は必須です'),
    is_proxy: z.boolean(),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .refine((data) => !data.is_proxy || !!data.proxy_agreed_at, {
    message: '合意日時は必須です',
    path: ['proxy_agreed_at'],
  })
  .refine((data) => !data.end_month || data.end_month >= data.start_month, {
    message: '終了月は開始月以降を指定してください',
    path: ['end_month'],
  });

type FeeAdjustmentFormInput = z.input<typeof feeAdjustmentFormSchema>;
type FeeAdjustmentFormValues = z.output<typeof feeAdjustmentFormSchema>;

// `pattern` / `value` intentionally start empty: they are required, so the user must pick them.
// `DefaultValues<T>` is deep-partial, which lets us express that without casting.
const DEFAULT_VALUES: DefaultValues<FeeAdjustmentFormInput> = {
  start_month: '',
  end_month: '',
  pattern: undefined,
  value: undefined,
  reason: '',
  is_proxy: false,
  proxy_agreed_at: undefined,
  proxy_method: '',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface FeeAdjustmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
}

// ── FeeAdjustmentSheet ─────────────────────────────────────────────────────────
export function FeeAdjustmentSheet({
  open,
  onOpenChange,
  memberId,
}: Readonly<FeeAdjustmentSheetProps>) {
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();

  const form = useForm<FeeAdjustmentFormInput, unknown, FeeAdjustmentFormValues>({
    resolver: zodResolver(feeAdjustmentFormSchema),
    mode: 'onSubmit',
    defaultValues: DEFAULT_VALUES,
  });

  const startMonth = useWatch({ control: form.control, name: 'start_month' });
  const pattern = useWatch({ control: form.control, name: 'pattern' });
  const isProxy = useWatch({ control: form.control, name: 'is_proxy' });
  const proxyAgreedAt = useWatch({ control: form.control, name: 'proxy_agreed_at' });
  const proxyMethod = useWatch({ control: form.control, name: 'proxy_method' });

  const mutation = useMutation({
    ...postCrmMembersByIdFeeAdjustmentsMutation(),
    onSuccess: async () => {
      toast.success('個別会費調整を追加しました');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getCrmMembersByIdFeeAdjustmentsQueryKey({ path: { id: memberId } }),
        }),
        // A-01 FR-006: the 「個別会費調整 適用中」 head-up badge is read from the member-detail
        // query, so it has to be refreshed too or it stays stale.
        queryClient.invalidateQueries({
          queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
        }),
      ]);
      handleClose();
    },
    onError: () => {
      toast.error('個別会費調整の追加に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      form.reset(DEFAULT_VALUES);
    }, 300);
  };

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      body: {
        // MonthPicker gives `YYYY/MM`; the API contract is `YYYY-MM`
        start_month: toApiYearMonth(data.start_month),
        end_month: toApiYearMonth(data.end_month),
        pattern: data.pattern,
        value: data.value,
        reason: data.reason,
        is_proxy: data.is_proxy,
        proxy_agreed_at: data.proxy_agreed_at,
        proxy_method: (data.proxy_method || undefined) as ProxyAgreementMethod | undefined,
      },
    });
  }, scrollToFirstError);

  const valuePlaceholder = pattern === 'discount_rate' ? '例: 10（%）' : '例: 1000（円）';

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <Settings2 className="size-4" />
              個別会費調整を追加
            </SheetTitle>
            <SheetDescription className="sr-only">個別会費調整の追加フォーム</SheetDescription>
          </SheetHeader>
        </div>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-y-auto px-6">
              {/* Period */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-4">
                <FormField
                  control={form.control}
                  name="start_month"
                  render={({ field, fieldState }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-sm font-medium">
                        開始月 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <MonthPicker
                        value={field.value}
                        min={formatDateYYYYMM(new Date())}
                        onChange={field.onChange}
                        hasError={!!fieldState.error}
                        className="w-full"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_month"
                  render={({ field, fieldState }) => (
                    <FormItem className="min-w-0">
                      <FormLabel className="text-sm font-medium">
                        終了月 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <MonthPicker
                        value={field.value}
                        min={startMonth || undefined}
                        onChange={field.onChange}
                        hasError={!!fieldState.error}
                        className="w-full"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Pattern + value */}
              <div className="flex flex-col gap-4 py-4">
                <FormField
                  control={form.control}
                  name="pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        パターン <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(v) => field.onChange(v as FeeAdjustmentPattern)}
                        items={FEE_ADJUSTMENT_PATTERNS}
                      >
                        <FormControl>
                          <SelectTrigger id="adj-pattern" className="h-9 text-sm">
                            <SelectValue placeholder="選択してください" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FEE_ADJUSTMENT_PATTERNS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        金額 / 率 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          className="h-9 text-sm"
                          placeholder={valuePlaceholder}
                          {...field}
                          value={field.value == null ? '' : String(field.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        事由 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="例：長期在籍優待割引"
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
                追加する
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
