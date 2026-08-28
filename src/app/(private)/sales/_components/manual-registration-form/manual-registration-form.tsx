'use client';

import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { MonthPicker } from '@/components/common/month-picker';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmBillingRecordsQueryKey,
  getCrmBillingRecordsSummaryQueryKey,
  getCrmStoresByStoreIdMembersOptions,
  getCrmStoresOptions,
  postCrmBillingRecordsManualMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  type ManualRegistrationFormValues,
  manualRegistrationFormSchema,
} from '../../_schemas/manual-registration-form.schema';
import { StoreMemberPicker } from '../store-member-picker';
import { ManualRegistrationConfirmDialog } from './manual-registration-confirm-dialog';
import {
  type ManualLineItemDraft,
  ManualRegistrationLineItems,
} from './manual-registration-line-items';

function currentBillingMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function todayBillingDate(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
}

function todayBillingDateISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function nowTimestamp(): string {
  return new Date().toLocaleString('ja-JP');
}

export function ManualRegistrationForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthUser();
  const [lineItems, setLineItems] = useState<ManualLineItemDraft[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const form = useForm<ManualRegistrationFormValues>({
    resolver: zodResolver(manualRegistrationFormSchema),
    mode: 'onSubmit',
    defaultValues: {
      store_id: '',
      member_id: '',
      billing_month: currentBillingMonth(),
      notes: '',
    },
  });

  const storeId = useWatch({ control: form.control, name: 'store_id' });
  const memberId = useWatch({ control: form.control, name: 'member_id' });
  const billingMonth = useWatch({
    control: form.control,
    name: 'billing_month',
  });

  const { data: storesRes } = useQuery(getCrmStoresOptions());
  const selectedStore = storesRes?.stores.find((s) => s.id === storeId);

  useEffect(() => {
    if (!storeId && storesRes?.stores.length) {
      form.setValue('store_id', storesRes.stores[0].id);
    }
  }, [storeId, storesRes, form]);

  const { data: membersRes } = useQuery({
    ...getCrmStoresByStoreIdMembersOptions({
      path: { storeId: storeId || '' },
    }),
    enabled: Boolean(storeId),
  });
  const selectedMember = membersRes?.members.find((m) => m.id === memberId);
  const isBlockedByUnpaid = selectedMember?.has_unpaid === true;

  const totalAmount = lineItems.reduce(
    (sum, item) => sum + Math.round(item.amount * (1 + item.taxRate)),
    0,
  );
  const canSubmit =
    Boolean(memberId) && !isBlockedByUnpaid && lineItems.length > 0 && Boolean(billingMonth);

  const mutation = useMutation({
    ...postCrmBillingRecordsManualMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsQueryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmBillingRecordsSummaryQueryKey(),
      });
      toast.success('請求を登録しました');
      router.push(navigate('/sales'));
    },
    onError: (error: Error) => {
      toast.error(error.message || '請求の登録に失敗しました');
    },
  });

  const buildRequestBody = (confirmationStatus: 'unconfirmed' | 'confirmed') => {
    const values = form.getValues();
    return {
      store_id: values.store_id,
      member_id: values.member_id,
      billing_month: values.billing_month,
      confirmation_status: confirmationStatus,
      notes: values.notes || null,
      line_items: lineItems.map((item) =>
        item.source === 'contract'
          ? { source: 'contract' as const, contract_id: item.contractId! }
          : {
              source: 'manual' as const,
              label: item.label,
              amount: item.amount,
              tax_rate: item.taxRate,
              reason: item.reason ?? '',
            },
      ),
    };
  };

  const handleRegisterUnconfirmed = form.handleSubmit(() => {
    if (!canSubmit) return;
    mutation.mutate({ body: buildRequestBody('unconfirmed') });
  });

  const handleConfirmedRegister = () => {
    setConfirmDialogOpen(false);
    mutation.mutate({ body: buildRequestBody('confirmed') });
  };

  return (
    <Form {...form}>
      <div className="mx-auto max-w-[960px] space-y-4">
        {isBlockedByUnpaid && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>この会員には未納金があります</AlertTitle>
            <AlertDescription>
              未納金のある会員への追加費用が発生する手動請求はブロックされます。未納金の解消後に再度お試しください。
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="space-y-4">
            <h3 className="text-sm font-bold">基本情報</h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">請求ID</span>
                <p className="text-muted-foreground text-sm">自動採番</p>
              </div>

              <StoreMemberPicker
                control={form.control}
                onStoreChange={() => {
                  form.resetField('member_id');
                  setLineItems([]);
                }}
                onMemberChange={() => setLineItems([])}
              />

              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">請求日</span>
                <Input type="date" value={todayBillingDateISO()} readOnly />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">請求方法</span>
                <p className="py-2 text-sm">手動</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">請求区分</span>
                <p className="py-2 text-sm">都度請求</p>
              </div>
              <FormField
                control={form.control}
                name="billing_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      適用月<span className="text-destructive ml-0.5">*</span>
                    </FormLabel>
                    <FormControl>
                      <MonthPicker
                        showArrows={false}
                        className="w-full"
                        value={field.value.replace('-', '/')}
                        onChange={(value) => field.onChange(value.replace('/', '-'))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>請求備考</FormLabel>
                  <FormControl>
                    <Textarea placeholder="備考を入力（任意）" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="px-4">
            <h3 className="mb-4 text-sm font-bold">集計情報</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">請求総額（税込）</span>
                <span className="text-sm font-medium tabular-nums">
                  {lineItems.length > 0 ? `¥${totalAmount.toLocaleString('ja-JP')}` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">明細件数</span>
                <span className="text-sm font-medium">
                  {lineItems.length > 0 ? `${lineItems.length}件` : '—'}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">作成日時</span>
                <span className="text-sm font-medium">{nowTimestamp()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">更新日時</span>
                <span className="text-sm font-medium">{nowTimestamp()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs">最終更新者</span>
                <span className="text-sm font-medium">{user?.name ?? '—'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ManualRegistrationLineItems
          memberId={memberId || null}
          items={lineItems}
          isBlockedByUnpaid={isBlockedByUnpaid}
          onAdd={(item) => setLineItems((prev) => [...prev, item])}
          onRemove={(id) => setLineItems((prev) => prev.filter((item) => item.id !== id))}
        />

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button size="lg" variant="outline" onClick={() => router.push(navigate('/sales'))}>
            キャンセル
          </Button>
          <RoleGatedButton
            requiredPermission={Permission.SalesConfirm}
            denyTooltip="請求を追加する権限がありません"
            size="lg"
            variant="outline"
            className="gap-2"
            disabled={!canSubmit || mutation.isPending}
            onClick={async () => {
              if (await form.trigger()) setConfirmDialogOpen(true);
            }}
          >
            <Lock className="size-4" />
            確定状態で登録
          </RoleGatedButton>
          <RoleGatedButton
            requiredPermission={Permission.SalesManualRegister}
            denyTooltip="請求を追加する権限がありません"
            size="lg"
            disabled={!canSubmit || mutation.isPending}
            onClick={handleRegisterUnconfirmed}
          >
            登録
          </RoleGatedButton>
        </div>

        <ManualRegistrationConfirmDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
          storeName={selectedStore?.name ?? '—'}
          memberName={selectedMember?.name ?? '—'}
          billingDate={todayBillingDate()}
          billingMonth={billingMonth}
          lineItemCount={lineItems.length}
          totalAmount={totalAmount}
          isSubmitting={mutation.isPending}
          onConfirm={handleConfirmedRegister}
        />
      </div>
    </Form>
  );
}
