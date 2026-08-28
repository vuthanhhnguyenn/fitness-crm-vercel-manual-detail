'use client';

import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Percent } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBillingRecordsByIdQueryKey,
  postCrmBillingRecordsByIdFeeAdjustmentsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { BillingRecordDetail, FeeAdjustmentPattern } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  type BillingFeeAdjustmentDialogSubmitValues,
  type BillingFeeAdjustmentDialogValues,
  billingFeeAdjustmentDialogSchema,
} from '../_schemas/billing-fee-adjustment-dialog.schema';

const PATTERN_LABELS: Record<FeeAdjustmentPattern, string> = {
  fixed_amount: '金額指定',
  discount_amount: '値引き額指定',
  discount_percent: '割引率指定',
  surcharge: '値増し額指定',
};

interface BillingFeeAdjustmentDialogProps {
  record: BillingRecordDetail;
}

export function BillingFeeAdjustmentDialog({ record }: Readonly<BillingFeeAdjustmentDialogProps>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const submittingRef = useRef(false);

  const { id: billingRecordId, line_items: lineItems } = record;
  const isConfirmed = record.confirmation_status === 'confirmed';

  const form = useForm<
    BillingFeeAdjustmentDialogValues,
    unknown,
    BillingFeeAdjustmentDialogSubmitValues
  >({
    resolver: zodResolver(billingFeeAdjustmentDialogSchema),
    mode: 'onSubmit',
    defaultValues: {
      target_line_item_id: 'record',
      pattern: 'fixed_amount',
      value: '',
      reason: '',
    },
  });

  const pattern = useWatch({ control: form.control, name: 'pattern' }) ?? 'fixed_amount';
  const suffix = pattern === 'discount_percent' ? '%' : '円';

  const mutation = useMutation({
    ...postCrmBillingRecordsByIdFeeAdjustmentsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsByIdQueryKey({ path: { id: billingRecordId } }),
      });
      toast.success('会費調整を登録しました');
      form.reset();
      setOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || '会費調整の登録に失敗しました');
    },
    onSettled: () => {
      submittingRef.current = false;
    },
  });

  const submitForm = form.handleSubmit((values) => {
    mutation.mutate({
      path: { id: billingRecordId },
      body: {
        target_line_item_id:
          values.target_line_item_id === 'record' ? null : values.target_line_item_id,
        pattern: values.pattern as FeeAdjustmentPattern,
        value: Number(values.value),
        reason: values.reason.trim(),
      },
    });
  });

  const handleSubmit = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    submitForm();
  };

  return (
    <>
      <RoleGatedButton
        requiredPermission={Permission.SalesFeeAdjust}
        denyTooltip="会費調整の権限がありません"
        variant="outline"
        size="sm"
        className="h-8 gap-1 text-xs"
        disabled={isConfirmed}
        onClick={() => setOpen(true)}
      >
        <Percent className="size-3" />
        会費調整
      </RoleGatedButton>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) form.reset();
        }}
      >
        <DialogContent className="sm:max-w-120">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">会費調整</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="target_line_item_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">
                      調整対象 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? 'record')}
                      items={toSelectItems([
                        { value: 'record', label: '請求全体' },
                        ...lineItems.map((item) => ({ value: item.id, label: item.label })),
                      ])}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="record">請求全体</SelectItem>
                        {lineItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.label}
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
                name="pattern"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">
                      調整パターン <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange((v ?? 'fixed_amount') as FeeAdjustmentPattern)
                      }
                      items={toSelectItems(
                        Object.entries(PATTERN_LABELS).map(([value, label]) => ({ value, label })),
                      )}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 w-full text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PATTERN_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
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
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">
                      調整値 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          className="h-8 pr-8 text-sm"
                          type="number"
                          placeholder="0"
                          {...field}
                        />
                        <span className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2 text-xs">
                          {suffix}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">
                      調整事由 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-20 text-sm"
                        placeholder="調整理由を入力してください"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button size="sm" disabled={mutation.isPending} onClick={handleSubmit}>
              適用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
