'use client';

import { useState } from 'react';

import { formatDate, formatYen } from '@/utils/format.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
  getCrmMembersByIdOptions,
  getCrmStoresByIdMainContractsOptions,
  patchCrmMembersByIdContractsMainContractChangeMutation,
} from '@/lib/api/@tanstack/react-query.gen';

function getNextMonthFirstLabel() {
  const today = new Date();
  const nextMonthFirst = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const ny = nextMonthFirst.getFullYear();
  const nm = nextMonthFirst.getMonth() + 1;
  return `${ny}年${nm}月${nextMonthFirst.getDate()}日`;
}

interface MainContractCardProps {
  memberId: string;
}

function MainContractCardSkeleton() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-4 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">主契約</CardTitle>
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
  const [selectedContractId, setSelectedContractId] = useState('');
  const queryClient = useQueryClient();
  const {
    data: mainContract,
    isLoading: isMainContractLoading,
    isFetching: isMainContractFetching,
  } = useQuery(
    getCrmMembersByIdContractsMainContractOptions({
      path: { id: memberId },
    }),
  );
  const { data: memberData, isLoading: isMemberLoading } = useQuery(
    getCrmMembersByIdOptions({
      path: { id: memberId },
    }),
  );
  const storeId = memberData?.profile.store_id;
  const { data: storeMainContracts, isLoading: isStoreMainContractsLoading } = useQuery({
    ...getCrmStoresByIdMainContractsOptions({
      path: { id: storeId ?? '' },
    }),
    enabled: Boolean(storeId) && open,
  });
  const { mutate: submitChangeMainContract, isPending: isChangingMainContract } = useMutation({
    ...patchCrmMembersByIdContractsMainContractChangeMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdContractsMainContractQueryKey({
          path: { id: memberId },
        }),
      });
      setOpen(false);
    },
  });

  const planOptions =
    storeMainContracts?.main_contracts.map((contract) => ({
      value: contract.id,
      label: contract.name,
      price: contract.price_including_tax,
    })) ?? [];
  const availablePlans = planOptions.filter((p) => p.label !== mainContract?.plan_name);
  const selectedContractData = planOptions.find((p) => p.value === selectedContractId);
  const planPriceDiff =
    selectedContractData && mainContract
      ? selectedContractData.price - mainContract.monthly_fee
      : null;

  const nextMonthFirstLabel = getNextMonthFirstLabel();

  const handleOpen = () => {
    setSelectedContractId('');
    setOpen(true);
  };

  if (isMainContractLoading || isMemberLoading) {
    return <MainContractCardSkeleton />;
  }

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">主契約</CardTitle>
            <Button variant="outline" size="sm" onClick={handleOpen}>
              変更
            </Button>
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">プラン名</TableHead>
              <TableHead className="text-right text-xs font-semibold">月額</TableHead>
              <TableHead className="text-xs font-semibold">適用開始日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mainContract ? (
              <TableRow>
                <TableCell className="text-sm font-medium">{mainContract.plan_name}</TableCell>
                <TableCell className="text-right text-sm">
                  {formatYen(mainContract.monthly_fee)}
                </TableCell>
                <TableCell className="text-sm">{formatDate(mainContract.start_date)}</TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground py-6 text-center text-sm">
                  該当のデータがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      {isMainContractFetching ? <Skeleton className="h-1 w-full rounded-none" /> : null}

      {/* 主契約変更 Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-[420px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[420px]">
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
                  <p className="text-sm font-medium">{mainContract?.plan_name ?? '—'}</p>
                  <p className="text-sm font-semibold">{formatYen(mainContract?.monthly_fee)}/月</p>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  適用開始日: {formatDate(mainContract?.start_date)}
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
                        {p.label}　¥{p.price.toLocaleString()}/月
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
                      ¥{(mainContract?.monthly_fee ?? 0).toLocaleString()}/月
                    </span>
                    <ArrowRight className="text-muted-foreground size-4" />
                    <span className="font-semibold">
                      ¥{selectedContractData.price.toLocaleString()}/月
                    </span>
                    {planPriceDiff !== 0 && (
                      <span
                        className={`ml-1 text-xs ${planPriceDiff > 0 ? 'text-destructive' : 'text-success'}`}
                      >
                        {planPriceDiff > 0
                          ? `+¥${planPriceDiff.toLocaleString()}`
                          : `-¥${Math.abs(planPriceDiff).toLocaleString()}`}
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
    </>
  );
}
