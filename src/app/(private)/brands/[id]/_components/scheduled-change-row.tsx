import { type UseFormReturn, useWatch } from 'react-hook-form';

import { format } from 'date-fns';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { type BrandFeeGroupFormValues } from '../_schemas/brand-fee-group-form.schema';
import {
  formatFeeValueInput,
  isPastDate,
  parseDateValue,
} from '../_utils/brand-fee-group-form.util';

export function ScheduledChangeRow({
  form,
  itemIndex,
  revisionIndex,
  onRemove,
}: {
  form: UseFormReturn<BrandFeeGroupFormValues>;
  itemIndex: number;
  revisionIndex: number;
  onRemove: () => void;
}) {
  const dateValue =
    useWatch({
      control: form.control,
      name: `feeItems.${itemIndex}.scheduledChanges.${revisionIndex}.effectiveStartDate`,
    }) ?? '';

  return (
    <div className="bg-muted/30 flex flex-col gap-2 rounded-lg border p-3 pr-1">
      <div className="flex items-start gap-1">
        <div className="flex flex-1 flex-col gap-2">
          <div className="grid gap-2.5 md:grid-cols-2">
            <FormField
              control={form.control}
              name={`feeItems.${itemIndex}.scheduledChanges.${revisionIndex}.effectiveStartDate`}
              render={({ field: dateField, fieldState }) => (
                <FormItem className="content-start">
                  <FormLabel className="text-xs font-medium text-slate-600">
                    有効開始日
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <DatePicker
                      date={parseDateValue(dateField.value)}
                      onDateChange={(date) => {
                        dateField.onChange(date ? format(date, 'yyyy/MM/dd') : '');
                        void form.trigger();
                      }}
                      placeholder="日付を選択"
                      hasError={fieldState.invalid}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`feeItems.${itemIndex}.scheduledChanges.${revisionIndex}.valueIncludingTaxYen`}
              render={({ field: priceField }) => (
                <FormItem className="content-start">
                  <FormLabel className="text-xs font-medium text-slate-600">
                    定価（税込）
                    <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-xs">
                        ¥
                      </span>
                      <Input
                        inputMode="numeric"
                        className="pl-7"
                        value={formatFeeValueInput(priceField.value)}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          if (nextValue === '' || nextValue === '-') {
                            priceField.onChange(Number.NaN);
                            void form.trigger();
                            return;
                          }
                          if (!/^-?\d+(\.\d+)?$/.test(nextValue)) return;
                          priceField.onChange(Number(nextValue));
                          void form.trigger();
                        }}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name={`feeItems.${itemIndex}.scheduledChanges.${revisionIndex}.effectiveStartDate`}
            render={({ fieldState }) =>
              fieldState.error ? (
                <Alert className="border-destructive/50 bg-destructive/10 py-2">
                  <AlertTriangle className="text-destructive mt-0.5 size-3.5" />
                  <AlertDescription className="text-destructive text-xs leading-5">
                    有効開始日が重複しています。別の日付を指定してください。
                  </AlertDescription>
                </Alert>
              ) : isPastDate(dateValue) ? (
                <Alert className="border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                  <AlertTriangle className="mt-0.5 size-3.5" />
                  <AlertDescription className="text-xs leading-5 text-orange-800">
                    過去の日付が指定されています。登録は可能ですが、即座に適用が開始されます。
                  </AlertDescription>
                </Alert>
              ) : (
                <span />
              )
            }
          />
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive mt-5 size-8"
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
