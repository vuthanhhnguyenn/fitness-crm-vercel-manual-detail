'use client';

import { useEffect, useRef } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { format, isBefore, isValid, parse, startOfDay } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import type { GetCrmBrandsByIdFeesResponse } from '@/lib/api/types.gen';

import {
  type BrandFeeGroupFormValues,
  brandFeeGroupFormSchema,
} from '../_schemas/brand-fee-group-form.schema';
import { FeeCurrentBadge } from './fee-current-badge';

type BrandFeeGroup = GetCrmBrandsByIdFeesResponse['fee_groups'][number];

const CIRCLED_NUMERALS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'] as const;

function toCircledNumeral(value: number): string {
  return CIRCLED_NUMERALS[value - 1] ?? `${value}`;
}

function parseDateValue(value: string): Date | undefined {
  const parsed = parse(value, 'yyyy/MM/dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

function isPastDate(value: string): boolean {
  const parsed = parseDateValue(value);
  if (!parsed) return false;
  return isBefore(startOfDay(parsed), startOfDay(new Date()));
}

function formatFeeValueInput(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '';
  }

  return String(value);
}

function buildDefaultValues(feeGroup: BrandFeeGroup | null): BrandFeeGroupFormValues {
  if (!feeGroup) {
    return { feeItems: [] };
  }

  return {
    feeItems: feeGroup.fee_items.map((item) => ({
      itemCode: item.item_code,
      itemName: item.item_name,
      effectiveStartDate: item.effective_start_date,
      currentValueIncludingTaxYen: item.current_value_including_tax_yen,
    })),
  };
}

function hasFeeGroupChanges(
  feeGroup: BrandFeeGroup | null,
  feeItems: BrandFeeGroupFormValues['feeItems'] | undefined,
): boolean {
  if (!feeGroup || !feeItems || feeItems.length !== feeGroup.fee_items.length) {
    return false;
  }

  return feeItems.some((item, index) => {
    const currentItem = feeGroup.fee_items[index];
    if (!currentItem) return false;

    return (
      item.itemName.trim() !== currentItem.item_name ||
      item.effectiveStartDate !== currentItem.effective_start_date ||
      item.currentValueIncludingTaxYen !== currentItem.current_value_including_tax_yen
    );
  });
}

interface BrandFeeGroupEditSheetProps {
  open: boolean;
  feeGroup: BrandFeeGroup | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: BrandFeeGroupFormValues, onError: (message: string) => void) => void;
}

export function BrandFeeGroupEditSheet({
  open,
  feeGroup,
  isSubmitting,
  onOpenChange,
  onSave,
}: BrandFeeGroupEditSheetProps) {
  const scrollToFirstError = useScrollToFirstError();
  const lastResetFeeMasterIdRef = useRef<string | null>(null);
  const form = useForm<BrandFeeGroupFormValues>({
    resolver: zodResolver(brandFeeGroupFormSchema) as never,
    mode: 'onChange',
    defaultValues: buildDefaultValues(feeGroup),
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'feeItems',
  });
  const watchedFeeItems = useWatch({
    control: form.control,
    name: 'feeItems',
  });

  useEffect(() => {
    if (!open) return;

    // Reset only when opening or switching to another fee group.
    if (lastResetFeeMasterIdRef.current !== (feeGroup?.fee_master_id ?? null)) {
      form.reset(buildDefaultValues(feeGroup));
      lastResetFeeMasterIdRef.current = feeGroup?.fee_master_id ?? null;
    }
  }, [open, form, feeGroup]);

  useEffect(() => {
    if (!open) {
      lastResetFeeMasterIdRef.current = null;
    }
  }, [open]);

  const canSubmit = form.formState.isValid && hasFeeGroupChanges(feeGroup, watchedFeeItems);

  const handleSubmit = (values: BrandFeeGroupFormValues) => {
    if (!hasFeeGroupChanges(feeGroup, values.feeItems)) {
      return;
    }

    form.clearErrors('root.serverError');
    onSave(values, (message) => {
      form.setError('root.serverError', {
        type: 'manual',
        message,
      });
    });
  };

  const title = feeGroup
    ? `${feeGroup.parent_brand_name} / ${feeGroup.display_name}の費用編集`
    : '費用編集';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-dvh w-[480px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]">
        <div className="shrink-0 border-b px-5 py-3.5">
          <SheetHeader className="gap-0 p-0 text-left">
            <SheetTitle className="text-sm font-semibold">{title}</SheetTitle>
            <SheetDescription className="sr-only">{title}フォーム</SheetDescription>
          </SheetHeader>
        </div>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit, scrollToFirstError)}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const dateValue = watchedFeeItems?.[index]?.effectiveStartDate ?? '';

                  return (
                    <div key={field.id} className="rounded-lg border px-4 py-4">
                      <p className="text-sm font-semibold">費用項目{toCircledNumeral(index + 1)}</p>

                      <FormField
                        control={form.control}
                        name={`feeItems.${index}.itemName`}
                        render={({ field: itemNameField }) => (
                          <FormItem className="mt-3">
                            <FormLabel className="text-sm font-medium">費用項目名</FormLabel>
                            <FormControl>
                              <Input {...itemNameField} />
                            </FormControl>
                            <FormDescription className="text-xs leading-4">
                              項目名を変更できます（FR-010）
                            </FormDescription>
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
                                    placeholder="yyyy/MM/dd"
                                    hasError={fieldState.invalid}
                                    onDateChange={(date) =>
                                      dateField.onChange(date ? format(date, 'yyyy/MM/dd') : '')
                                    }
                                  />
                                </FormControl>
                                <div className="mt-0.5">
                                  {fieldState.error ? (
                                    <FormMessage className="text-xs leading-4" />
                                  ) : null}
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
                                        if (nextValue === '') {
                                          priceField.onChange(Number.NaN);
                                          return;
                                        }
                                        if (!/^\d+$/.test(nextValue)) return;
                                        priceField.onChange(Number(nextValue));
                                      }}
                                    />
                                  </div>
                                </FormControl>
                                <div className="mt-0.5">
                                  {fieldState.error ? (
                                    <FormMessage className="text-xs leading-4" />
                                  ) : null}
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
                    </div>
                  );
                })}

                {form.formState.errors.root?.serverError?.message && (
                  <Alert variant="destructive">
                    <AlertTriangle className="mt-0.5 size-4" />
                    <AlertDescription>
                      {form.formState.errors.root.serverError.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t px-5 pt-3.5 pb-8">
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-md text-sm"
                onClick={() => onOpenChange(false)}
              >
                キャンセル
              </Button>
              <Button
                type="submit"
                className="h-8 rounded-md text-sm"
                disabled={isSubmitting || !canSubmit}
              >
                保存する
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
