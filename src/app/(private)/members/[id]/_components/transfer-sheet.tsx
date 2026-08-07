'use client';

import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Store } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmStoresOptions,
  getCrmTransfersQueryKey,
  postCrmMembersByIdTransferMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { type GetCrmStoresResponse, MainBrand } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { ProxyApplicationSection } from './proxy-application-section';

type StoreRow = GetCrmStoresResponse['stores'][number];

// ── Zod schema ────────────────────────────────────────────────────────────────
const transferFormSchema = z
  .object({
    to_store_id: z.string().min(1, '移籍先店舗は必須です'),
    to_store_name: z.string().min(1),
    reason: z.string().optional(),
    is_proxy: z.boolean(),
    proxy_agreed_at: z.string().optional(),
    proxy_method: z.string().optional(),
  })
  .refine((data) => !data.is_proxy || !!data.proxy_agreed_at, {
    message: '合意日時は必須です',
    path: ['proxy_agreed_at'],
  });

type TransferFormValues = z.infer<typeof transferFormSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────
interface TransferSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  currentStoreId: string;
  currentStoreName: string;
  hasUnpaidFee: boolean;
  inCancellationPeriod: boolean;
}

// ── TransferSheet ─────────────────────────────────────────────────────────────
export function TransferSheet({
  open,
  onOpenChange,
  memberId,
  currentStoreId,
  currentStoreName,
  hasUnpaidFee,
  inCancellationPeriod,
}: Readonly<TransferSheetProps>) {
  const queryClient = useQueryClient();

  // Field state
  const [toStore, setToStore] = useState<StoreRow | null>(null);
  const [reason, setReason] = useState('');
  const [isProxy, setIsProxy] = useState(false);
  const [proxyAgreedAt, setProxyAgreedAt] = useState<Date | undefined>(undefined);
  const [proxyMethod, setProxyMethod] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Partial<Record<keyof TransferFormValues, string>>>({});

  // Confirm dialog state
  const [showConfirm, setShowConfirm] = useState(false);

  // Stores list
  const { data: storesRes } = useQuery({
    ...getCrmStoresOptions({
      query: { page: 1, limit: 100, sort_by: 'name', sort_order: 'asc' },
    }),
  });
  const storeOptions = (storesRes?.stores ?? [])
    .filter((s) => s.id !== currentStoreId)
    .map((s) => ({ value: s.id, label: s.name }));

  const mutation = useMutation({
    ...postCrmMembersByIdTransferMutation(),
    onSuccess: () => {
      toast.success('移籍申請を受け付けました', {
        description: '移籍先店舗に通知を送りました',
      });
      queryClient.invalidateQueries({ queryKey: getCrmTransfersQueryKey(), refetchType: 'all' });
      handleClose();
    },
    onError: () => {
      toast.error('移籍申請に失敗しました');
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setToStore(null);
      setReason('');
      setIsProxy(false);
      setProxyAgreedAt(undefined);
      setProxyMethod('');
      setErrors({});
    }, 300);
  };

  const handleSubmitClick = () => {
    const values: TransferFormValues = {
      to_store_id: toStore?.id || '',
      to_store_name: toStore?.name || '',
      reason: reason || undefined,
      is_proxy: isProxy,
      proxy_agreed_at: proxyAgreedAt ? proxyAgreedAt.toISOString() : undefined,
      proxy_method: proxyMethod || undefined,
    };

    const result = transferFormSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof TransferFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof TransferFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setTimeout(() => setShowConfirm(true), 150);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    mutation.mutate({
      path: { id: memberId },
      body: {
        to_store_id: toStore?.id || '',
        to_store_name: toStore?.name || '',
        reason: reason || undefined,
        is_proxy: isProxy,
        proxy_agreed_at: proxyAgreedAt ? proxyAgreedAt.toISOString() : undefined,
        proxy_method: proxyMethod || undefined,
      },
    });
  };

  const handleProxyAgreedAtChange = (date: Date | undefined) => {
    setProxyAgreedAt(date);
    if (date) setErrors((prev) => ({ ...prev, proxy_agreed_at: undefined }));
  };

  const handleStoreChange = (storeId: string | null) => {
    if (!storeId) return;
    setToStore(storesRes?.stores.find((s) => s.id === storeId) ?? null);
    setErrors((prev) => ({ ...prev, to_store_id: undefined }));
  };

  const isDisabled = hasUnpaidFee || inCancellationPeriod;

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
          {/* Header */}
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <ArrowRightLeft className="size-4" />
                移籍申請
              </SheetTitle>
              <SheetDescription className="sr-only">移籍申請フォーム</SheetDescription>
            </SheetHeader>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6">
            {/* Cancellation period warning */}
            {inCancellationPeriod && (
              <div className="pt-4">
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertDescription className="text-destructive text-xs">
                    解約手数料期間中のため移籍できません。管理者にお問い合わせください。
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Unpaid fee warning */}
            {!inCancellationPeriod && hasUnpaidFee && (
              <div className="pt-4">
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertDescription className="text-destructive text-xs">
                    未納金があるため操作できません。未納金を解消してから移籍申請を行ってください。
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Proxy section */}
            <div className="py-4">
              <ProxyApplicationSection
                isProxy={isProxy}
                onIsProxyChange={setIsProxy}
                agreedAt={proxyAgreedAt}
                onAgreedAtChange={handleProxyAgreedAtChange}
                method={proxyMethod}
                onMethodChange={setProxyMethod}
                agreedAtError={errors.proxy_agreed_at}
              />
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            {/* Store selection */}
            <div className="flex flex-col gap-4 py-4">
              {/* Current store */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">現在の主契約店舗</Label>
                <div className="bg-muted/50 flex items-center gap-2 rounded-md px-3 py-2">
                  <Store className="text-muted-foreground size-4" />
                  <span className="text-sm font-medium">{currentStoreName}</span>
                </div>
              </div>

              {/* Target store */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="transfer-store" className="text-sm font-medium">
                  移籍先店舗 <span className="text-destructive ml-1 text-xs">*</span>
                </Label>
                <Select
                  value={toStore?.id}
                  onValueChange={handleStoreChange}
                  disabled={isDisabled}
                  items={storeOptions}
                >
                  <SelectTrigger
                    id="transfer-store"
                    className={cn('h-9 text-sm', errors.to_store_id && 'border-destructive')}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.to_store_id && (
                  <p className="text-destructive text-xs">{errors.to_store_id}</p>
                )}
              </div>
              {toStore && (
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-muted-foreground mb-1 text-xs">移籍ワークフロー</p>
                  <p className="text-sm font-medium">
                    {toStore.brand == MainBrand.JOYFIT
                      ? '① 申請 → ② 移籍元承認 → ③ 自動移籍'
                      : '① 申請 → ② 移籍元承認 → ③ 移籍先承認 → ④ 移籍実行'}
                  </p>
                </div>
              )}
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            {/* Reason */}
            <div className="flex flex-col gap-2 py-4">
              <Label htmlFor="transfer-reason" className="text-sm font-medium">
                移籍理由 <span className="text-muted-foreground ml-1 text-xs">任意</span>
              </Label>
              <Textarea
                id="transfer-reason"
                rows={3}
                className="resize-none text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isDisabled}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 gap-2 border-t px-6 py-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={mutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={isDisabled || mutation.isPending}
              onClick={handleSubmitClick}
            >
              移籍申請を送信
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirm AlertDialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>移籍申請を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {currentStoreName} から {toStore?.name}{' '}
              への移籍を申請します。移籍先店舗に通知が送られます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowConfirm(false);
              }}
            >
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>送信する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
