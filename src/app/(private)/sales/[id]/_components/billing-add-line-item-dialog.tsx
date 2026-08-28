'use client';

import { useForm, useWatch } from 'react-hook-form';

import { toSelectItems } from '@/utils/app.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  getCrmBillingRecordsQueryKey,
  getCrmMembersByIdContractsMainContractOptions,
  getCrmMembersByIdContractsOptionContractsOptions,
  postCrmBillingRecordsByIdLineItemsMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type AddLineItemFormSubmitValues,
  type AddLineItemFormValues,
  addLineItemFormSchema,
} from '../../_schemas/add-line-item-form.schema';
import { buildContractOptions } from '../../_utils/contract-options.util';

const SOURCE_OPTIONS = [
  { value: 'contract', label: '契約から選択' },
  { value: 'manual', label: 'その他(手動入力)' },
];

const TAX_RATE_OPTIONS = [
  { value: '10', label: '10%' },
  { value: '8', label: '8%（軽減）' },
];

interface BillingAddLineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingRecordId: string;
  memberId: string;
  outstandingAmount: number;
}

export function BillingAddLineItemDialog({
  open,
  onOpenChange,
  billingRecordId,
  memberId,
  outstandingAmount,
}: Readonly<BillingAddLineItemDialogProps>) {
  const queryClient = useQueryClient();

  const form = useForm<AddLineItemFormValues, unknown, AddLineItemFormSubmitValues>({
    resolver: zodResolver(addLineItemFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      source: 'contract',
      contract_id: '',
      label: '',
      amount: '',
      tax_rate: '10',
      reason: '',
    },
  });

  const source = useWatch({ control: form.control, name: 'source' }) ?? 'contract';

  const { data: mainContract } = useQuery({
    ...getCrmMembersByIdContractsMainContractOptions({
      path: { id: memberId },
    }),
    enabled: open,
  });
  const { data: optionContracts } = useQuery({
    ...getCrmMembersByIdContractsOptionContractsOptions({
      path: { id: memberId },
    }),
    enabled: open,
  });
  const contractOptions = buildContractOptions(mainContract, optionContracts);
  const isBlockedByOutstanding = outstandingAmount > 0;

  const mutation = useMutation({
    ...postCrmBillingRecordsByIdLineItemsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsByIdQueryKey({
          path: { id: billingRecordId },
        }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsQueryKey(),
      });
      toast.success('請求明細を追加しました');
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || '請求明細の追加に失敗しました');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    if (isBlockedByOutstanding) return;
    if (values.source === 'contract') {
      mutation.mutate({
        path: { id: billingRecordId },
        body: { source: 'contract', contract_id: values.contract_id },
      });
    } else {
      mutation.mutate({
        path: { id: billingRecordId },
        body: {
          source: 'manual',
          label: values.label.trim(),
          amount: Number(values.amount),
          tax_rate: Number(values.tax_rate) / 100,
          reason: values.reason.trim(),
        },
      });
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) form.reset();
      }}
    >
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle className="text-base">請求明細を追加</DialogTitle>
          <DialogDescription className="text-xs">
            契約から追加するか、手動補正項目として追加するかを選択してください。
          </DialogDescription>
        </DialogHeader>

        {isBlockedByOutstanding && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>この会員には未納金があります</AlertTitle>
            <AlertDescription>
              未納金（¥{outstandingAmount.toLocaleString('ja-JP')}
              ）のある会員への追加費用が発生する明細追加はブロックされます。未納金の解消後に再度お試しください。
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">追加方法</FormLabel>
                  <Select
                    value={field.value ?? 'contract'}
                    onValueChange={(value) => field.onChange(value ?? 'contract')}
                    items={toSelectItems(SOURCE_OPTIONS)}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="contract">契約から選択</SelectItem>
                      <SelectItem value="manual">その他(手動入力)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {source === 'contract' ? (
              <FormField
                control={form.control}
                name="contract_id"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs">
                      契約 <span className="text-destructive">*</span>
                    </FormLabel>
                    {contractOptions.length === 0 ? (
                      <p className="text-muted-foreground text-xs">
                        先に利用者を選択してください。
                      </p>
                    ) : (
                      <Select
                        value={field.value ?? ''}
                        onValueChange={(value) => field.onChange(value ?? '')}
                        items={toSelectItems(
                          contractOptions.map((option) => ({
                            value: option.id,
                            label: `${option.label}（¥${option.amount.toLocaleString('ja-JP')}）`,
                          })),
                        )}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 w-full text-sm">
                            <SelectValue placeholder="契約を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {contractOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}（¥{option.amount.toLocaleString('ja-JP')}）
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">
                        請求項目（手動入力） <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input className="h-8 text-sm" placeholder="例: 臨時清掃料" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs">
                          請求額 <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input className="h-8 text-sm" type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs">税率</FormLabel>
                        <Select
                          value={field.value ?? '10'}
                          onValueChange={(value) => field.onChange(value ?? '10')}
                          items={toSelectItems(TAX_RATE_OPTIONS)}
                        >
                          <FormControl>
                            <SelectTrigger className="h-8 w-full text-sm">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="8">8%（軽減）</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className="text-xs">
                        補正事由 <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          className="min-h-15 text-sm"
                          placeholder="補正の理由を具体的に記載してください"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>
        </Form>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button
            size="sm"
            disabled={isBlockedByOutstanding || mutation.isPending}
            onClick={handleSubmit}
          >
            追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
