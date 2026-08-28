'use client';

import { useState } from 'react';

import { formatDate, formatNextMonthStart, formatYen } from '@/utils/format.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, LoaderCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { RoleGatedButton } from '@/components/common/role-gated-button';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  getCrmMembersByIdContractsMainContractOptions,
  getCrmMembersByIdContractsMainContractQueryKey,
  getCrmMembersByIdContractsSummaryQueryKey,
  getCrmMembersByIdOptions,
  getCrmMembersByIdQueryKey,
  getCrmStoresByIdMainContractsOptions,
  patchCrmMembersByIdContractsMainContractChangeMutation,
  postCrmMembersByIdContractsMainContractChangeCancelMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { cn } from '@/lib/utils';

import { UserRole } from '@/types/permission.type';

const MAIN_CONTRACT_CHANGE_ROLES = [UserRole.Headquarter, UserRole.System] as const;

interface MainContractCardProps {
  memberId: string;
}

function MainContractCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">主契約</CardTitle>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardHeader>
      <div className="space-y-3 px-4 pb-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
}

export function MainContractCard({ memberId }: MainContractCardProps) {
  const [open, setOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const queryClient = useQueryClient();
  const {
    data: mainContract,
    isLoading: isMainContractLoading,
    isFetching: isMainContractFetching,
    isError: isMainContractError,
    refetch: refetchMainContract,
  } = useQuery(
    getCrmMembersByIdContractsMainContractOptions({
      path: { id: memberId },
    }),
  );
  const {
    data: memberData,
    isLoading: isMemberLoading,
    isError: isMemberError,
    refetch: refetchMember,
  } = useQuery(
    getCrmMembersByIdOptions({
      path: { id: memberId },
    }),
  );
  const storeId = memberData?.primaryStore.storeId;
  const { data: storeMainContracts, isLoading: isStoreMainContractsLoading } = useQuery({
    ...getCrmStoresByIdMainContractsOptions({
      path: { id: storeId ?? '' },
    }),
    enabled: Boolean(storeId) && open,
  });
  /** The contract read, the head-up bundle and 契約サマリー all reflect a plan change. */
  const refreshContractQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdContractsMainContractQueryKey({
          path: { id: memberId },
        }),
      }),
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      }),
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdContractsSummaryQueryKey({ path: { id: memberId } }),
      }),
    ]);

  const { mutate: submitChangeMainContract, isPending: isChangingMainContract } = useMutation({
    ...patchCrmMembersByIdContractsMainContractChangeMutation(),
    onSuccess: async () => {
      // A-01 FR-013a: this registers an application — the plan itself changes at month start
      toast.success('主契約の変更申請を登録しました');
      await refreshContractQueries();
      setOpen(false);
    },
    onError: () => {
      toast.error('主契約の変更申請に失敗しました');
    },
  });

  const { mutate: cancelPlanChange, isPending: isCancellingPlanChange } = useMutation({
    ...postCrmMembersByIdContractsMainContractChangeCancelMutation(),
    onSuccess: async () => {
      toast.success('主契約の変更申請を取り消しました');
      await refreshContractQueries();
      setCancelDialogOpen(false);
    },
    onError: () => {
      toast.error('変更申請の取り消しに失敗しました');
    },
  });

  const planOptions =
    storeMainContracts?.main_contracts.map((contract) => ({
      value: contract.id,
      label: contract.name,
      price: contract.price_including_tax,
    })) ?? [];
  // Exclude the plan the member is already on — matched by master ID, not by display name
  const availablePlans = planOptions.filter((p) => p.value !== mainContract?.id);
  const selectedContractData = planOptions.find((p) => p.value === selectedContractId);
  const planPriceDiff =
    selectedContractData && mainContract
      ? selectedContractData.price - mainContract.monthlyFee
      : null;

  const pendingPlanChange = mainContract?.pendingPlanChange;
  // A bulk change is an HQ instruction that is already booked; a single change is a
  // request that can still be withdrawn. Same field, different wording and controls
  // (backend design answer 2026-08-10, QA09 §2.2).
  const isBulkPlanChange = pendingPlanChange?.source === 'bulk_job';

  const nextMonthFirstLabel = formatNextMonthStart();

  // Dim the card while refetching instead of pushing an extra bar into the layout
  const showOverlay = isMainContractFetching && !isMainContractLoading;

  const handleOpen = () => {
    setSelectedContractId('');
    setOpen(true);
  };

  return (
    <>
      <DataStateBoundary
        isLoading={isMainContractLoading || isMemberLoading}
        isError={isMainContractError || isMemberError}
        isEmpty={!mainContract}
        onRetry={() => {
          void refetchMainContract();
          void refetchMember();
        }}
        errorTitle="主契約の取得に失敗しました"
        emptyTitle="主契約はありません"
        skeleton={<MainContractCardSkeleton />}
      >
        <Card className="relative gap-0 py-0">
          {showOverlay && (
            <div className="bg-background/40 pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <LoaderCircle className="text-muted-foreground size-6 animate-spin" />
            </div>
          )}
          <CardHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">主契約</CardTitle>
                {memberData?.currentMainContract?.activeFeeAdjustment && (
                  <Badge variant="secondary" className="text-[10px]">
                    個別会費調整 適用中
                  </Badge>
                )}
              </div>
              {/* A-01 FR-013a: only one application may be pending, so the trigger states why
                  it is unavailable instead of being hidden */}
              <RoleGatedButton
                allowedRoles={MAIN_CONTRACT_CHANGE_ROLES}
                denyTooltip="主契約の変更は本部のみ可能です"
                variant="outline"
                size="sm"
                disabled={Boolean(pendingPlanChange)}
                tooltip={
                  pendingPlanChange
                    ? isBulkPlanChange
                      ? '一括変更の予約が登録されています'
                      : '変更申請が既に登録されています'
                    : undefined
                }
                onClick={handleOpen}
              >
                変更
              </RoleGatedButton>
            </div>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">プラン名</TableHead>
                <TableHead className="text-right text-xs font-semibold">月額</TableHead>
                <TableHead className="text-xs font-semibold">適用開始日</TableHead>
                <TableHead className="text-xs font-semibold">状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn('transition-opacity', showOverlay && 'opacity-50')}>
              <TableRow>
                <TableCell className="text-sm font-medium">{mainContract?.planName}</TableCell>
                <TableCell className="text-right text-sm">
                  {formatYen(mainContract?.monthlyFee)}
                </TableCell>
                <TableCell className="text-sm">{formatDate(mainContract?.startDate)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className="border-success/20 bg-success/15 text-success text-[10px]"
                  >
                    有効
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* A-01 FR-013a: a submitted change stays pending until the month-start run, so the
              card shows what will happen and offers a way back out */}
          {pendingPlanChange && (
            <div className="px-4 pb-4">
              <Alert className="border-info/20 bg-info/10">
                <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-info text-xs">
                    {pendingPlanChange.toPlanName}（{formatYen(pendingPlanChange.toMonthlyFee)}
                    /月）へ{isBulkPlanChange ? '変更予約済み' : '変更申請中'} —{' '}
                    {formatDate(pendingPlanChange.effectiveFrom)}から適用
                    {isBulkPlanChange && '（本部の一括変更）'}
                  </span>
                  <RoleGatedButton
                    allowedRoles={MAIN_CONTRACT_CHANGE_ROLES}
                    denyTooltip="主契約の変更は本部のみ可能です"
                    variant="outline"
                    size="sm"
                    onClick={() => setCancelDialogOpen(true)}
                  >
                    {isBulkPlanChange ? '予約を取り消す' : '申請を取り消す'}
                  </RoleGatedButton>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </Card>
      </DataStateBoundary>

      {/* Main-contract change Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-135 flex-col gap-0 overflow-hidden p-0 sm:max-w-135">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <RefreshCw className="size-4" />
                主契約変更
              </SheetTitle>
              <SheetDescription className="sr-only">主契約変更フォーム</SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="py-4">
              <div className="bg-muted/40 rounded-md p-3">
                <p className="text-muted-foreground mb-2 text-xs font-medium">現在の契約</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{mainContract?.planName ?? '—'}</p>
                  <p className="text-sm font-semibold">{formatYen(mainContract?.monthlyFee)}/月</p>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  適用開始日: {formatDate(mainContract?.startDate)}
                </p>
              </div>
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="plan-select" className="text-sm font-medium">
                  変更先プラン <span className="text-destructive ml-1 text-xs">*</span>
                </Label>
                <Select
                  value={selectedContractId}
                  onValueChange={(value) => setSelectedContractId(value ?? '')}
                  items={availablePlans}
                >
                  <SelectTrigger
                    id="plan-select"
                    className="h-9 text-sm"
                    disabled={isStoreMainContractsLoading || availablePlans.length === 0}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {isStoreMainContractsLoading ? (
                      <div className="px-2 py-2">
                        <Skeleton className="h-7 w-full" />
                      </div>
                    ) : null}
                    {availablePlans.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}　{formatYen(p.price)}/月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedContractData && planPriceDiff !== null && (
                <div className="flex flex-col gap-2 rounded-md border p-3">
                  <p className="text-muted-foreground text-xs font-medium">料金変更</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      {formatYen(mainContract?.monthlyFee ?? 0)}/月
                    </span>
                    <ArrowRight className="text-muted-foreground size-4" />
                    <span className="font-semibold">
                      {formatYen(selectedContractData.price)}/月
                    </span>
                    {planPriceDiff !== 0 && (
                      <span
                        className={`ml-1 text-xs ${planPriceDiff > 0 ? 'text-destructive' : 'text-success'}`}
                      >
                        {planPriceDiff > 0
                          ? `+${formatYen(planPriceDiff)}`
                          : `-${formatYen(Math.abs(planPriceDiff))}`}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <Alert className="border-info/20 bg-info/10">
                <AlertDescription className="text-info text-xs">
                  翌月月初（{nextMonthFirstLabel}）から適用されます。
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedContractId || isChangingMainContract}
              onClick={() => {
                submitChangeMainContract({
                  path: { id: memberId },
                  body: { contract_id: selectedContractId },
                });
              }}
            >
              {isChangingMainContract ? '送信中...' : '変更申請を送信'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancelling a registered application is a state change the operator should confirm */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBulkPlanChange ? '変更予約を取り消しますか？' : '変更申請を取り消しますか？'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPlanChange
                ? `${pendingPlanChange.toPlanName}への${isBulkPlanChange ? '変更予約' : '変更申請'}を取り消し、現在の${mainContract?.planName ?? '主契約'}のままにします。`
                : '変更申請を取り消します。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancellingPlanChange}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancellingPlanChange || !pendingPlanChange}
              onClick={() => {
                if (!pendingPlanChange) return;
                cancelPlanChange({
                  path: { id: memberId },
                  body: { application_id: pendingPlanChange.applicationId },
                });
              }}
            >
              {isCancellingPlanChange ? '取り消し中...' : '取り消す'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
