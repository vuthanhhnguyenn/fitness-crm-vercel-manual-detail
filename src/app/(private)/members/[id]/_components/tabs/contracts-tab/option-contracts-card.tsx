'use client';

import { useRef, useState } from 'react';

import { formatISODateLocal } from '@/utils/date.util';
import {
  formatDate,
  formatJapaneseDate,
  formatJapaneseMonthDay,
  formatNextMonthStart,
  formatYen,
} from '@/utils/format.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfMonth } from 'date-fns';
import { MoreHorizontal, Plus, RefreshCw, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Textarea } from '@/components/ui/textarea';

import {
  getCrmMembersByIdContractsOptionContractsOptions,
  getCrmMembersByIdContractsOptionContractsQueryKey,
  getCrmMembersByIdContractsSummaryQueryKey,
  getCrmMembersByIdOptions,
  getCrmMembersByIdQueryKey,
  getCrmStoresByIdOptionsOptions,
  patchCrmMembersByIdContractsOptionContractsCancelMutation,
  patchCrmMembersByIdContractsOptionContractsChangeMutation,
  postCrmMembersByIdContractsOptionContractsMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import { Permission } from '@/types/permission.type';

function getDateLabels() {
  const today = new Date();
  const nextMonthFirstLabel = formatNextMonthStart();
  const lastDayOfMonth = endOfMonth(today);
  return {
    todayLabel: `${formatJapaneseDate(today)}〜（日割り料金適用）`,
    nextMonthLabel: `${nextMonthFirstLabel}〜（${formatJapaneseMonthDay(lastDayOfMonth)}までキャンセル可）`,
    nextMonthFirstLabel,
  };
}

/**
 * Row action menu. The sheet is opened from `onOpenChangeComplete`, i.e. once the menu has
 * finished closing and restored focus to its trigger — opening it straight from the item handler
 * makes the two fight over focus.
 */
function OptionRowActions({
  option,
  disabled,
  onChange,
  onCancel,
}: {
  option: TargetOption;
  disabled: boolean;
  onChange: (option: TargetOption) => void;
  onCancel: (option: TargetOption) => void;
}) {
  const pendingAction = useRef<'change' | 'cancel' | null>(null);

  return (
    <DropdownMenu
      onOpenChangeComplete={(isOpen) => {
        if (isOpen || !pendingAction.current) return;
        const action = pendingAction.current;
        pendingAction.current = null;
        if (action === 'change') onChange(option);
        else onCancel(option);
      }}
    >
      <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-md">
        <MoreHorizontal className="text-muted-foreground size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <RoleGatedMenuItem
          requiredPermission={Permission.MembersOptionContractOperate}
          denyBadge="権限なし"
          disabled={disabled}
          onClick={() => {
            pendingAction.current = 'change';
          }}
        >
          変更
        </RoleGatedMenuItem>
        <RoleGatedMenuItem
          requiredPermission={Permission.MembersOptionContractOperate}
          denyBadge="権限なし"
          className="text-destructive"
          disabled={disabled}
          onClick={() => {
            pendingAction.current = 'cancel';
          }}
        >
          解約
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface OptionContractsCardProps {
  memberId: string;
  isOnLeave: boolean;
  isRetirePending: boolean;
  hasUnpaidFee: boolean;
  /** A-01 FR-007 edge case: block add/change/cancel during the cancellation-fee period (option only) */
  inCancellationPeriod: boolean;
}

type TargetOption = { id: string; name: string; monthlyFee: number };

const OPTION_STATUS_META: Record<
  'active' | 'scheduled' | 'cancel_scheduled',
  { label: string; className: string }
> = {
  active: { label: '適用中', className: 'border-success/20 bg-success/15 text-success' },
  scheduled: { label: '翌月適用', className: 'border-info/20 bg-info/15 text-info' },
  cancel_scheduled: {
    label: '解約予定',
    className: 'border-warning/20 bg-warning/15 text-warning',
  },
};

export function OptionContractsCard({
  memberId,
  isOnLeave,
  isRetirePending,
  hasUnpaidFee,
  inCancellationPeriod,
}: OptionContractsCardProps) {
  const queryClient = useQueryClient();

  // Add sheet state
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [optionTiming, setOptionTiming] = useState('今日から');
  // A-01 FR-007: 日割り対応オプションは月途中の任意日から開始できる
  const [optionStartDate, setOptionStartDate] = useState<Date | undefined>(undefined);

  // Change sheet state
  const [showChangeSheet, setShowChangeSheet] = useState(false);
  const [targetOption, setTargetOption] = useState<TargetOption | null>(null);
  const [optionChangeToId, setOptionChangeToId] = useState('');

  // Cancel sheet state
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [optionCancelTiming, setOptionCancelTiming] = useState('即時解約');
  const [optionCancelReason, setOptionCancelReason] = useState('');

  const {
    data: optionContracts,
    isLoading: isOptionContractsLoading,
    isError: isOptionContractsError,
    refetch: refetchOptionContracts,
  } = useQuery(
    getCrmMembersByIdContractsOptionContractsOptions({
      path: { id: memberId },
    }),
  );

  // A-01 FR-007 edge cases: block operations while suspended / pending withdrawal / in the
  // cancellation-fee period (option only); block additions when there is an unpaid fee
  const optionAddBlocked = isOnLeave || isRetirePending || hasUnpaidFee || inCancellationPeriod;
  const optionEditBlocked = isOnLeave || isRetirePending || inCancellationPeriod;

  const { data: memberData } = useQuery(
    getCrmMembersByIdOptions({
      path: { id: memberId },
    }),
  );
  const storeId = memberData?.primaryStore.storeId;
  // The option master feeds BOTH the add sheet and the change sheet, so it has to be enabled for
  // either one — gating it on the add sheet alone leaves 変更先オプション empty.
  const { data: storeOptionsData, isLoading: isStoreOptionsLoading } = useQuery({
    ...getCrmStoresByIdOptionsOptions({
      path: { id: storeId ?? '' },
    }),
    enabled: Boolean(storeId) && (showAddSheet || showChangeSheet),
  });
  const allAvailableOptions =
    storeOptionsData?.options.map((option) => ({
      value: option.id,
      label: option.name,
      price: option.price_including_tax,
      description: option.related_option_name ?? '',
      /** 日割り要否 (option master flag) — drives the 開始タイミング branch below */
      prorated: option.prorated_enabled,
    })) ?? [];
  // Already-contracted options are excluded by master ID, not by display name
  const contractedOptionIds = new Set(optionContracts?.map((o) => o.id) ?? []);
  const availableOptions = allAvailableOptions.filter((o) => !contractedOptionIds.has(o.value));
  // Change-target options: exclude the option being changed itself
  const optionChangeCandidates = allAvailableOptions.filter((o) => o.value !== targetOption?.id);

  const { todayLabel, nextMonthLabel, nextMonthFirstLabel } = getDateLabels();

  const selectedOptionData = allAvailableOptions.find((o) => o.value === selectedOptionId);
  const isProratedOption = selectedOptionData?.prorated ?? false;

  const invalidateContractQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdContractsOptionContractsQueryKey({
          path: { id: memberId },
        }),
      }),
      // 契約サマリー (月額合計) and the head-up bundle aggregate the option contracts too
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdContractsSummaryQueryKey({ path: { id: memberId } }),
      }),
      queryClient.invalidateQueries({
        queryKey: getCrmMembersByIdQueryKey({ path: { id: memberId } }),
      }),
    ]);
  };

  const { mutate: submitAddOption, isPending: isAddingOption } = useMutation({
    ...postCrmMembersByIdContractsOptionContractsMutation(),
    onSuccess: async () => {
      toast.success('オプション契約を追加しました');
      await invalidateContractQueries();
      setShowAddSheet(false);
      setSelectedOptionId('');
      setOptionTiming('今日から');
      setOptionStartDate(undefined);
    },
    onError: () => {
      toast.error('オプション契約の追加に失敗しました');
    },
  });

  const { mutate: submitChangeOption, isPending: isChangingOption } = useMutation({
    ...patchCrmMembersByIdContractsOptionContractsChangeMutation(),
    onSuccess: async () => {
      toast.success('オプション契約を変更しました');
      await invalidateContractQueries();
      setShowChangeSheet(false);
      setTargetOption(null);
      setOptionChangeToId('');
    },
    onError: () => {
      toast.error('オプション契約の変更に失敗しました');
    },
  });

  const { mutate: submitCancelOption, isPending: isCancellingOption } = useMutation({
    ...patchCrmMembersByIdContractsOptionContractsCancelMutation(),
    onSuccess: async () => {
      toast.success('オプション契約を解約しました');
      await invalidateContractQueries();
      setShowCancelSheet(false);
      setTargetOption(null);
      setOptionCancelTiming('即時解約');
      setOptionCancelReason('');
    },
    onError: () => {
      toast.error('オプション契約の解約に失敗しました');
    },
  });

  const handleOptionAdd = () => {
    setSelectedOptionId('');
    setOptionTiming('今日から');
    setOptionStartDate(undefined);
    setShowAddSheet(true);
  };

  const handleOptionChange = (opt: TargetOption) => {
    setTargetOption(opt);
    setOptionChangeToId('');
    setShowChangeSheet(true);
  };

  const handleOptionCancel = (opt: TargetOption) => {
    setTargetOption(opt);
    setOptionCancelTiming('即時解約');
    setOptionCancelReason('');
    setShowCancelSheet(true);
  };

  return (
    <>
      <Card className="gap-0 py-0">
        <CardHeader className="px-4 py-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">オプション契約</CardTitle>
            <RoleGatedButton
              requiredPermission={Permission.MembersOptionContractOperate}
              denyTooltip="オプション操作の権限がありません"
              variant="outline"
              size="sm"
              disabled={optionAddBlocked}
              onClick={handleOptionAdd}
            >
              + 追加
            </RoleGatedButton>
          </div>
        </CardHeader>

        {isOnLeave && (
          <div className="px-4 pb-3">
            <Alert className="border-warning/20 bg-warning/10">
              <AlertDescription className="text-warning text-xs">
                休会中はオプション契約の変更・追加・解約ができません
              </AlertDescription>
            </Alert>
          </div>
        )}
        {isRetirePending && !isOnLeave && (
          <div className="px-4 pb-3">
            <Alert className="border-warning/20 bg-warning/10">
              <AlertDescription className="text-warning text-xs">
                退会予定のため、オプション契約の変更はできません
              </AlertDescription>
            </Alert>
          </div>
        )}
        {inCancellationPeriod && !isOnLeave && !isRetirePending && (
          <div className="px-4 pb-3">
            <Alert className="border-warning/20 bg-warning/10">
              <AlertDescription className="text-warning text-xs">
                解約手数料期間中のため、オプション契約の追加・変更・解約ができません
              </AlertDescription>
            </Alert>
          </div>
        )}
        {hasUnpaidFee && !isOnLeave && !isRetirePending && !inCancellationPeriod && (
          <div className="px-4 pb-3">
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertDescription className="text-destructive text-xs">
                未納金があるため、追加費用が発生するオプション追加はできません
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DataStateBoundary
          isLoading={isOptionContractsLoading}
          isError={isOptionContractsError}
          isEmpty={!optionContracts}
          onRetry={() => refetchOptionContracts()}
          errorTitle="オプション契約の取得に失敗しました"
          skeleton={
            <div className="space-y-3 px-4 pb-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`option-contract-row-${index}`} className="h-9 w-full" />
              ))}
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">オプション名</TableHead>
                <TableHead className="text-right text-xs font-semibold">月額</TableHead>
                <TableHead className="text-xs font-semibold">適用開始日</TableHead>
                <TableHead className="text-xs font-semibold">状態</TableHead>
                <TableHead className="w-10 text-xs font-semibold" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {optionContracts && optionContracts.length > 0 ? (
                optionContracts.map((opt) => (
                  <TableRow key={opt.id}>
                    <TableCell className="text-sm font-medium">{opt.name}</TableCell>
                    <TableCell className="text-right text-sm">
                      {formatYen(opt.monthlyFee)}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(opt.startDate)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${OPTION_STATUS_META[opt.status ?? 'active'].className}`}
                      >
                        {OPTION_STATUS_META[opt.status ?? 'active'].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <OptionRowActions
                        option={{
                          id: opt.id,
                          name: opt.name,
                          monthlyFee: opt.monthlyFee,
                        }}
                        disabled={optionEditBlocked}
                        onChange={handleOptionChange}
                        onCancel={handleOptionCancel}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-6 text-center text-sm">
                    オプション契約はありません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DataStateBoundary>
      </Card>

      {/* Option change Sheet */}
      <Sheet open={showChangeSheet} onOpenChange={setShowChangeSheet}>
        <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-120">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <RefreshCw className="size-4" />
                オプション変更
              </SheetTitle>
              <SheetDescription className="sr-only">オプション変更フォーム</SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="flex flex-col gap-4 py-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">現在のオプション</p>
                <p className="text-sm font-medium">
                  {targetOption
                    ? `${targetOption.name}　${formatYen(targetOption.monthlyFee)}/月`
                    : '—'}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="option-change-to" className="text-sm font-medium">
                  変更先オプション <span className="text-destructive ml-1 text-xs">*</span>
                </Label>
                <Select
                  value={optionChangeToId}
                  onValueChange={(value) => setOptionChangeToId(value ?? '')}
                  items={optionChangeCandidates}
                >
                  <SelectTrigger
                    id="option-change-to"
                    className="h-9 text-sm"
                    disabled={isStoreOptionsLoading}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {isStoreOptionsLoading ? (
                      <div className="px-2 py-2">
                        <Skeleton className="h-7 w-full" />
                      </div>
                    ) : optionChangeCandidates.length > 0 ? (
                      optionChangeCandidates.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}　{formatYen(o.price)}/月
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_none" disabled>
                        変更できるオプションはありません
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Alert className="border-info/20 bg-info/10">
                <AlertDescription className="text-info text-xs">
                  変更は翌月月初（{nextMonthFirstLabel}）から適用されます
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowChangeSheet(false)}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={!optionChangeToId || !targetOption || isChangingOption}
              onClick={() => {
                if (!targetOption) return;
                submitChangeOption({
                  path: { id: memberId },
                  body: {
                    current_option_id: targetOption.id,
                    next_option_id: optionChangeToId,
                  },
                });
              }}
            >
              {isChangingOption ? '送信中...' : '変更'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Option cancellation Sheet */}
      <Sheet open={showCancelSheet} onOpenChange={setShowCancelSheet}>
        <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-120">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <ShieldOff className="size-4" />
                オプション解約
              </SheetTitle>
              <SheetDescription className="sr-only">オプション解約フォーム</SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="flex flex-col gap-4 py-4">
              <div>
                <p className="text-muted-foreground mb-1 text-xs">解約対象</p>
                <p className="text-sm font-medium">
                  {targetOption
                    ? `${targetOption.name}　${formatYen(targetOption.monthlyFee)}/月`
                    : '—'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Label className="text-sm font-medium">
                  解約タイミング <span className="text-destructive ml-1 text-xs">*</span>
                </Label>
                <RadioGroup
                  value={optionCancelTiming}
                  onValueChange={setOptionCancelTiming}
                  className="flex flex-col gap-2"
                >
                  <label
                    htmlFor="cancel-timing-immediate"
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                      optionCancelTiming === '即時解約'
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem
                      id="cancel-timing-immediate"
                      value="即時解約"
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">即時解約</span>
                      <span className="text-muted-foreground text-xs">本日付で解約</span>
                    </div>
                  </label>
                  <label
                    htmlFor="cancel-timing-next"
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                      optionCancelTiming === '翌月末解約'
                        ? 'border-primary bg-primary/10'
                        : 'border-border'
                    }`}
                  >
                    <RadioGroupItem id="cancel-timing-next" value="翌月末解約" className="mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">翌月末解約</span>
                      <span className="text-muted-foreground text-xs">来月末で解約</span>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="option-cancel-reason" className="text-sm font-medium">
                  解約理由 <span className="text-muted-foreground ml-1 text-xs">任意</span>
                </Label>
                <Textarea
                  id="option-cancel-reason"
                  rows={3}
                  className="resize-none text-sm"
                  value={optionCancelReason}
                  onChange={(e) => setOptionCancelReason(e.target.value)}
                />
              </div>
              <Alert className="border-warning/20 bg-warning/10">
                <AlertDescription className="text-warning text-xs">
                  解約後の再追加は翌月以降になります
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelSheet(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (!targetOption) return;
                submitCancelOption({
                  path: { id: memberId },
                  body: {
                    option_id: targetOption.id,
                    cancel_timing:
                      optionCancelTiming === '即時解約' ? 'immediate' : 'end_of_next_month',
                    reason: optionCancelReason.trim() || undefined,
                  },
                });
              }}
              disabled={!targetOption || isCancellingOption}
            >
              {isCancellingOption ? '送信中...' : '解約'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Option add Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="flex w-120 flex-col gap-0 overflow-hidden p-0 sm:max-w-120">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <Plus className="size-4" />
                オプション追加
              </SheetTitle>
              <SheetDescription className="sr-only">オプション追加フォーム</SheetDescription>
            </SheetHeader>
          </div>

          {/* No 未納金 alert here: the 追加 button is already disabled in that case (FR-007),
              so the sheet can never be opened while an unpaid fee exists. */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="option-select" className="text-sm font-medium">
                  追加するオプション <span className="text-destructive ml-1 text-xs">*</span>
                </Label>
                <Select
                  value={selectedOptionId}
                  onValueChange={(value) => setSelectedOptionId(value ?? '')}
                  items={availableOptions}
                >
                  <SelectTrigger
                    id="option-select"
                    className="h-9 text-sm"
                    disabled={isStoreOptionsLoading}
                  >
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.length > 0 ? (
                      availableOptions.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}　{formatYen(o.price)}/月
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="_none" disabled>
                        追加できるオプションはありません
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedOptionData && (
                <div className="bg-muted/40 flex flex-col gap-1 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{selectedOptionData.label}</p>
                    <p className="text-sm font-semibold">
                      {formatYen(selectedOptionData.price)}/月
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">{selectedOptionData.description}</p>
                </div>
              )}
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            <div className="flex flex-col gap-3 py-4">
              <Label className="text-sm font-medium">開始タイミング</Label>
              {isProratedOption ? (
                // 日割りフラグ ON: 任意日付指定
                <div className="flex flex-col gap-2">
                  <DatePicker
                    date={optionStartDate}
                    onDateChange={setOptionStartDate}
                    placeholder="開始日を選択"
                  />
                  <p className="text-muted-foreground text-xs">
                    指定した日から利用開始となり、月末までの日割り料金が適用されます。
                  </p>
                </div>
              ) : (
                // 日割りフラグ OFF: 今日から / 翌月から の2択
                <>
                  <RadioGroup
                    value={optionTiming}
                    onValueChange={setOptionTiming}
                    className="flex flex-col gap-2"
                  >
                    <label
                      htmlFor="timing-today"
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                        optionTiming === '今日から'
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem id="timing-today" value="今日から" className="mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">今日から</span>
                        <span className="text-muted-foreground text-xs">{todayLabel}</span>
                      </div>
                    </label>
                    <label
                      htmlFor="timing-next"
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                        optionTiming === '翌月から'
                          ? 'border-primary bg-primary/10'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem id="timing-next" value="翌月から" className="mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">翌月から</span>
                        <span className="text-muted-foreground text-xs">{nextMonthLabel}</span>
                      </div>
                    </label>
                  </RadioGroup>
                  {optionTiming === '今日から' && (
                    <Alert className="border-info/20 bg-info/15">
                      <AlertDescription className="text-info text-xs">
                        JACCS契約の場合、月途中加入の日割り分は翌月の月額料金に合算して請求されます。
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddSheet(false)}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={
                hasUnpaidFee ||
                !selectedOptionId ||
                isAddingOption ||
                (isProratedOption && !optionStartDate)
              }
              onClick={() => {
                submitAddOption({
                  path: { id: memberId },
                  body: isProratedOption
                    ? {
                        option_id: selectedOptionId,
                        apply_from: 'specific_date',
                        start_date: optionStartDate
                          ? formatISODateLocal(optionStartDate)
                          : undefined,
                      }
                    : {
                        option_id: selectedOptionId,
                        apply_from: optionTiming === '今日から' ? 'today' : 'next_month',
                      },
                });
              }}
            >
              {isAddingOption ? '送信中...' : 'オプションを追加'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
