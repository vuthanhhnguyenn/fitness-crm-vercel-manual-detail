'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';

import {
  getCrmMembersByIdQueryKey,
  postCrmMembersByIdReEnrollMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

const RE_ENROLL_PLANS = [
  { value: 'レギュラー会員', label: 'レギュラー会員', price: '¥7,700/月' },
  { value: 'プレミアム会員', label: 'プレミアム会員', price: '¥9,900/月' },
  { value: 'ナイト会員', label: 'ナイト会員', price: '¥5,500/月' },
] as const;

// Form schema
const reEnrollFormSchema = z.object({
  re_enroll_month: z
    .string()
    .min(1, '再入会月は必須です')
    .regex(/^\d{4}-\d{2}$/, '正しい形式で入力してください'),
  plan: z.string().min(1, 'プランは必須です'),
  fee_waived: z.boolean(),
});

type ReEnrollFormValues = z.infer<typeof reEnrollFormSchema>;

interface ReEnrollSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  withdrawnAt?: string;
  lastPlan?: string;
}

export function ReEnrollSheet({
  open,
  onOpenChange,
  memberId,
  withdrawnAt,
  lastPlan,
}: Readonly<ReEnrollSheetProps>) {
  const queryClient = useQueryClient();

  const form = useForm<ReEnrollFormValues>({
    resolver: zodResolver(reEnrollFormSchema),
    defaultValues: {
      re_enroll_month: '',
      plan: RE_ENROLL_PLANS[0].value,
      fee_waived: false,
    },
  });

  // Calculate minimum re-enroll month (current month or next)
  const minReEnrollMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const mutation = useMutation({
    ...postCrmMembersByIdReEnrollMutation(),
    onSuccess: () => {
      toast.success('再入会手続きを受け付けました');
      // Invalidate member detail so the status refreshes
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      });
      handleClose();
    },
    onError: () => {
      toast.error('再入会手続きに失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after animation
    setTimeout(() => {
      form.reset();
    }, 300);
  };

  const handleSubmit = form.handleSubmit((data) => {
    mutation.mutate({
      path: { id: memberId },
      body: {
        re_enroll_month: data.re_enroll_month,
        plan: data.plan,
        fee_waived: data.fee_waived,
      },
    });
  });

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
        {/* Header */}
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <UserCheck className="size-4" />
              再入会
            </SheetTitle>
            <SheetDescription className="text-muted-foreground mt-1 text-xs">
              退会済みの会員を再入会させます
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Body */}
        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
            <div className="flex-1 overflow-y-auto px-6">
              {/* Previous contract info */}
              <div className="flex flex-col gap-4 py-4">
                <p className="text-muted-foreground text-xs font-medium">以前の契約情報</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">退会日</p>
                    <p className="text-sm font-medium">{withdrawnAt ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs">旧プラン</p>
                    <p className="text-sm font-medium">{lastPlan ?? '—'}</p>
                  </div>
                </div>
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Re-enroll month */}
              <div className="flex flex-col gap-4 py-4">
                <FormField
                  control={form.control}
                  name="re_enroll_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        再入会月 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <FormControl>
                        <MonthPicker
                          value={field.value}
                          onChange={field.onChange}
                          min={minReEnrollMonth}
                          placeholder="年月を選択"
                          hasError={!!form.formState.errors.re_enroll_month}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Plan selection */}
              <div className="flex flex-col gap-3 py-4">
                <FormField
                  control={form.control}
                  name="plan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        プラン選択 <span className="text-destructive ml-1 text-xs">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-col gap-2"
                        >
                          {RE_ENROLL_PLANS.map((plan) => (
                            <label
                              key={plan.value}
                              htmlFor={`plan-${plan.value}`}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 transition-colors',
                                field.value === plan.value
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border',
                              )}
                            >
                              <RadioGroupItem id={`plan-${plan.value}`} value={plan.value} />
                              <div className="flex flex-1 items-center justify-between">
                                <span className="text-sm font-medium">{plan.label}</span>
                                <span className="text-muted-foreground text-sm">{plan.price}</span>
                              </div>
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              {/* Fee waived toggle */}
              <div className="flex flex-col gap-3 py-4">
                <FormField
                  control={form.control}
                  name="fee_waived"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <FormLabel className="text-sm font-medium">入会金を免除する</FormLabel>
                          <p className="text-muted-foreground text-xs">
                            再入会優遇として入会金を免除できます
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t p-4">
              <Button
                variant="outline"
                size="lg"
                onClick={handleClose}
                disabled={mutation.isPending}
              >
                キャンセル
              </Button>
              <Button size="lg" type="submit" disabled={mutation.isPending}>
                再入会を確定する
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
