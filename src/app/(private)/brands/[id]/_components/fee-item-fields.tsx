import { type UseFormReturn, useFieldArray, useWatch } from 'react-hook-form';

import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { formatYen } from '@/utils/format.util';
import { format } from 'date-fns';
import { AlertTriangle, CalendarClock, Plus } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { type BrandFeeGroupFormValues } from '../_schemas/brand-fee-group-form.schema';
import {
  formatFeeValueInput,
  isPastDate,
  parseDateValue,
} from '../_utils/brand-fee-group-form.util';
import { FeeCurrentBadge } from './fee-current-badge';
import { ScheduledChangeRow } from './scheduled-change-row';

export function FeeItemFields({
  form,
  index,
  itemLabel,
}: {
  form: UseFormReturn<BrandFeeGroupFormValues>;
  index: number;
  itemLabel: string;
}) {
  const {
    fields: revisionFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: `feeItems.${index}.scheduledChanges`,
  });

  const dateValue =
    useWatch({ control: form.control, name: `feeItems.${index}.effectiveStartDate` }) ?? '';
  const priceValue = useWatch({
    control: form.control,
    name: `feeItems.${index}.currentValueIncludingTaxYen`,
  });
  const itemNameValue =
    useWatch({ control: form.control, name: `feeItems.${index}.itemName` }) ?? '';
  const previewAmount =
    typeof priceValue === 'number' && !Number.isNaN(priceValue) ? priceValue : 0;

  return (
    <div className="rounded-lg border px-4 py-4">
      <p className="text-sm font-semibold">{itemLabel}</p>

      <FormField
        control={form.control}
        name={`feeItems.${index}.itemName`}
        render={({ field: itemNameField }) => (
          <FormItem className="mt-3">
            <FormLabel className="text-sm font-medium">費用項目名</FormLabel>
            <FormControl>
              <Input maxLength={TEXT_MAX_LENGTH} {...itemNameField} />
            </FormControl>
            <FormDescription className="text-xs leading-4">項目名を変更できます</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="mt-3 flex items-center gap-2">
        <p className="text-sm font-medium text-slate-700">現行設定</p>
        <FeeCurrentBadge />
      </div>

      <div className="bg-muted/30 mt-2.5 rounded-md border px-3 py-3">
        <div className="grid gap-2.5 md:grid-cols-2">
          <FormField
            control={form.control}
            name={`feeItems.${index}.effectiveStartDate`}
            render={({ field: dateField, fieldState }) => (
              <FormItem className="content-start">
                <FormLabel className="text-sm font-medium text-slate-600">
                  有効開始日
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <DatePicker
                    date={parseDateValue(dateField.value)}
                    onDateChange={(date) => {
                      dateField.onChange(date ? format(date, 'yyyy/MM/dd') : '');
                      // Cross-field: this date is compared against every
                      // scheduledChanges[].effectiveStartDate in the schema's superRefine.
                      void form.trigger();
                    }}
                    placeholder="日付を選択"
                    hasError={fieldState.invalid}
                  />
                </FormControl>
                <div className="mt-0.5">
                  {fieldState.error ? <FormMessage className="text-xs leading-4" /> : null}
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`feeItems.${index}.currentValueIncludingTaxYen`}
            render={({ field: priceField, fieldState }) => (
              <FormItem className="content-start">
                <FormLabel className="text-sm font-medium text-slate-600">
                  定価（税込）
                  <span className="text-destructive ml-1">*</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                      ¥
                    </span>
                    <Input
                      inputMode="numeric"
                      className="pl-8"
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
                <div className="mt-0.5">
                  {fieldState.error ? <FormMessage className="text-xs leading-4" /> : null}
                </div>
              </FormItem>
            )}
          />
        </div>

        {isPastDate(dateValue) && (
          <Alert className="mt-2.5 border-orange-200 bg-orange-50 px-3 py-2.5 text-orange-800">
            <AlertTriangle className="mt-0.5 size-4" />
            <AlertDescription className="text-xs leading-5 text-orange-800">
              過去の日付が指定されています。登録は可能ですが、即座に適用が開始されます。
            </AlertDescription>
          </Alert>
        )}
      </div>

      {revisionFields.length > 0 && (
        <div className="mt-4">
          <div className="mb-2.5 flex items-center gap-2">
            <CalendarClock className="text-muted-foreground size-3.5" />
            <p className="text-xs font-medium text-slate-700">予約中の改定</p>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              {revisionFields.length}件
            </Badge>
          </div>

          <div className="flex flex-col gap-2">
            {revisionFields.map((field, revisionIndex) => (
              <ScheduledChangeRow
                key={field.id}
                form={form}
                itemIndex={index}
                revisionIndex={revisionIndex}
                onRemove={() => {
                  remove(revisionIndex);
                  void form.trigger();
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          onClick={() => append({ effectiveStartDate: '', valueIncludingTaxYen: Number.NaN })}
        >
          <Plus className="size-3.5" />
          改定スケジュールを追加
        </Button>
        <p className="text-muted-foreground mt-1 text-xs">
          将来日付を指定して改定を事前登録できます。
        </p>
      </div>

      <Separator className="my-4" />

      <div className="bg-muted/40 rounded-md border p-3">
        <p className="text-muted-foreground mb-1 text-xs">プレビュー（会員向け表示）</p>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-semibold">{formatYen(previewAmount)}</span>
          <span className="text-muted-foreground text-xs">（税込）</span>
        </div>
        <p className="text-muted-foreground mt-0.5 text-xs wrap-break-word">{itemNameValue}</p>
      </div>
    </div>
  );
}
