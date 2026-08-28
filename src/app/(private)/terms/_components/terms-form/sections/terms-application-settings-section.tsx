'use client';

import { useFormContext } from 'react-hook-form';

import type { TermsFormValues } from '@/app/(private)/terms/_schemas/terms-form.schema';
import { formatISODateLocal, parseDate } from '@/utils/date.util';

import { OptionalMark, RequiredMark } from '@/components/common/field-marker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface TermsApplicationSettingsSectionProps {
  isCopiedFieldLocked: boolean;
}

export function TermsApplicationSettingsSection({
  isCopiedFieldLocked,
}: Readonly<TermsApplicationSettingsSectionProps>) {
  const form = useFormContext<TermsFormValues>();
  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">適用設定</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4">
        <FormField
          control={form.control}
          name="effectiveFrom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                適用開始日
                <RequiredMark />
              </FormLabel>
              <FormControl>
                <DatePicker
                  date={parseDate(field.value) ?? undefined}
                  onDateChange={(date) => field.onChange(date ? formatISODateLocal(date) : '')}
                  placeholder="日付を選択"
                  hasError={!!errors.effectiveFrom}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="effectiveTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                適用終了予定日
                <OptionalMark />
              </FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value ? (parseDate(field.value) ?? undefined) : undefined}
                  onDateChange={(date) => field.onChange(date ? formatISODateLocal(date) : null)}
                  placeholder="日付を選択"
                  hasError={!!errors.effectiveTo}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="displayOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                表示順
                <OptionalMark />
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="1"
                  className="max-w-30"
                  disabled={isCopiedFieldLocked}
                  value={field.value ?? ''}
                  onChange={(event) =>
                    field.onChange(event.target.value === '' ? null : Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiresConsent"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-medium">
                    承諾ボタン表示
                    <RequiredMark />
                  </Label>
                  <p className="text-muted-foreground text-xs">
                    ONにすると、会員に対して規約への同意ボタンが表示されます
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isCopiedFieldLocked}
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
