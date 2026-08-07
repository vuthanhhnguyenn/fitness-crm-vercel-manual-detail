'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import type { CampaignFormValues } from '../_schemas/campaign-form.schema';

export function CampaignFormDiscountSettings() {
  const form = useFormContext<CampaignFormValues>();
  const discountAmount = useWatch({ control: form.control, name: 'discount.amount' });
  const discountRate = useWatch({ control: form.control, name: 'discount.rate' });
  const discountFirstMonthEnabled = useWatch({
    control: form.control,
    name: 'discount.first_month_enabled',
  });
  const discountSecondMonthEnabled = useWatch({
    control: form.control,
    name: 'discount.second_month_enabled',
  });

  const isDiscountAmountLocked = discountRate != null;
  const isDiscountRateLocked = discountAmount != null;
  const showDiscountHint =
    (discountFirstMonthEnabled || discountSecondMonthEnabled) &&
    discountAmount == null &&
    discountRate == null;
  const discountMonthError = (
    form.formState.errors.discount as { enabled_months?: { message?: string } } | undefined
  )?.enabled_months?.message;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">割引設定</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4">
        <p className="text-muted-foreground text-xs">
          割引は初月・翌月のみ設定できます。割引額または割引率のどちらか一方を入力してください。
        </p>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">対象月</p>
          <div className="flex flex-col gap-3">
            <FormField
              control={form.control}
              name="discount.first_month_enabled"
              render={({ field }) => (
                <FormItem className="rounded-lg border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <FormLabel>初月</FormLabel>
                      <p className="text-muted-foreground text-xs">利用開始月に割引を適用</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount.second_month_enabled"
              render={({ field }) => (
                <FormItem className="rounded-lg border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <FormLabel>翌月</FormLabel>
                      <p className="text-muted-foreground text-xs">利用開始月の翌月に割引を適用</p>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {discountMonthError ? (
            <p className="text-destructive text-xs">{discountMonthError}</p>
          ) : null}
        </div>

        <Separator />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="discount.amount"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>割引額（円）</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="例: 3000"
                      disabled={isDiscountAmountLocked}
                      value={field.value == null ? '' : String(field.value)}
                      onChange={(event) => {
                        const digitsOnly = event.target.value.replace(/\D/g, '');
                        const nextAmount = digitsOnly === '' ? null : Number(digitsOnly);
                        field.onChange(nextAmount);
                        if (nextAmount !== null) {
                          form.setValue('discount.rate', null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <span className="text-muted-foreground shrink-0 text-sm">円</span>
                </div>
                <p
                  className={
                    showDiscountHint ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'
                  }
                >
                  定額値引の場合に入力してください
                </p>
                {fieldState.error?.message ? <FormMessage /> : null}
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="discount.rate"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>割引率（%）</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="例: 50"
                      disabled={isDiscountRateLocked}
                      value={field.value == null ? '' : String(field.value)}
                      onChange={(event) => {
                        const digitsOnly = event.target.value.replace(/\D/g, '');
                        const nextRate = digitsOnly === '' ? null : Number(digitsOnly);
                        field.onChange(nextRate);
                        if (nextRate !== null) {
                          form.setValue('discount.amount', null, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <span className="text-muted-foreground shrink-0 text-sm">%</span>
                </div>
                <p
                  className={
                    showDiscountHint ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'
                  }
                >
                  定率値引の場合に入力してください
                </p>
                {fieldState.error?.message ? <FormMessage /> : null}
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
