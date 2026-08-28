'use client';

import { useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import {
  getCrmBrandsByIdChangeHistoryQueryKey,
  getCrmBrandsByIdFeesQueryKey,
  getCrmBrandsByIdQueryKey,
  patchCrmBrandsByIdFeesBySubBrandCodeMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type BrandFeeGroupFormValues,
  brandFeeGroupFormSchema,
} from '../_schemas/brand-fee-group-form.schema';
import type { BrandFeeGroup } from '../_types/brand-fee.type';
import { buildDefaultValues, hasFeeGroupChanges } from '../_utils/brand-fee-group-form.util';
import { toCircledNumeral } from '../_utils/brand-fee.util';
import { FeeItemFields } from './fee-item-fields';

interface BrandFeeGroupEditSheetProps {
  brandId: string;
  feeGroup: BrandFeeGroup | null;
  onOpenChange: (open: boolean) => void;
}

export function BrandFeeGroupEditSheet({
  brandId,
  feeGroup,
  onOpenChange,
}: BrandFeeGroupEditSheetProps) {
  const open = !!feeGroup;
  const queryClient = useQueryClient();
  const scrollToFirstError = useScrollToFirstError();
  const lastResetFeeMasterIdRef = useRef<string | null>(null);
  const form = useForm<BrandFeeGroupFormValues>({
    resolver: zodResolver(brandFeeGroupFormSchema) as never,
    mode: 'onChange',
    defaultValues: buildDefaultValues(feeGroup),
  });

  const updateFeeGroupMutation = useMutation({
    ...patchCrmBrandsByIdFeesBySubBrandCodeMutation(),
    onSuccess: (response) => {
      toast.success(response.message || '費用設定を保存しました');
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdFeesQueryKey({ path: { id: brandId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdQueryKey({ path: { id: brandId } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBrandsByIdChangeHistoryQueryKey({ path: { id: brandId } }),
      });
      onOpenChange(false);
    },
  });
  const isSubmitting = updateFeeGroupMutation.isPending;

  const { fields } = useFieldArray({
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

  const handleInvalidSubmit = () => {
    scrollToFirstError();
  };

  const handleSubmit = (values: BrandFeeGroupFormValues) => {
    if (!feeGroup) return;

    if (!hasFeeGroupChanges(feeGroup, values.feeItems)) {
      toast.error('変更がありません');
      return;
    }

    updateFeeGroupMutation.mutate(
      {
        path: {
          id: brandId,
          subBrandCode: feeGroup.sub_brand_code,
        },
        body: {
          fee_items: values.feeItems.map((item) => ({
            item_code: item.itemCode,
            item_name: item.itemName.trim(),
            effective_start_date: item.effectiveStartDate,
            current_value_including_tax_yen: item.currentValueIncludingTaxYen,
            scheduled_changes: item.scheduledChanges.map((change) => ({
              effective_start_date: change.effectiveStartDate,
              value_including_tax_yen: change.valueIncludingTaxYen,
            })),
          })),
        },
      },
      {
        onError: () => {
          toast.error('費用設定の保存に失敗しました。後で再試行してください。');
        },
      },
    );
  };

  const title = feeGroup
    ? `${feeGroup.parent_brand_name} / ${feeGroup.display_name}の費用編集`
    : '費用編集';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-dvh w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]">
        <div className="shrink-0 border-b px-5 py-3.5">
          <SheetHeader className="gap-0 p-0 text-left">
            <SheetTitle className="text-sm font-semibold">{title}</SheetTitle>
            <SheetDescription className="sr-only">{title}フォーム</SheetDescription>
          </SheetHeader>
        </div>

        <Form {...form}>
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={form.handleSubmit(handleSubmit, handleInvalidSubmit)}
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <FeeItemFields
                    key={field.id}
                    form={form}
                    index={index}
                    itemLabel={`費用項目${toCircledNumeral(index + 1)}`}
                  />
                ))}
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
                disabled={isSubmitting && form.formState.isSubmitted}
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
