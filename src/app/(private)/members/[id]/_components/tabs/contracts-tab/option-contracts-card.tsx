'use client';

import { useState } from 'react';

import { formatDate, formatYen } from '@/utils/format.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Plus, RefreshCw, ShieldOff } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  getCrmMembersByIdOptions,
  getCrmStoresByIdOptionsOptions,
  patchCrmMembersByIdContractsOptionContractsCancelMutation,
  patchCrmMembersByIdContractsOptionContractsChangeMutation,
  postCrmMembersByIdContractsOptionContractsMutation,
} from '@/lib/api/@tanstack/react-query.gen';

function getDateLabels() {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const nextMonthFirst = new Date(y, today.getMonth() + 1, 1);
  const lastDayOfMonth = new Date(y, today.getMonth() + 1, 0);
  const nm = nextMonthFirst.getMonth() + 1;
  const ny = nextMonthFirst.getFullYear();
  return {
    todayLabel: `${y}年${m}月${d}日〜（日割り料金適用）`,
    nextMonthLabel: `${ny}年${nm}月${nextMonthFirst.getDate()}日〜（${y}年${m}月${lastDayOfMonth.getDate()}日までキャンセル可）`,
    nextMonthFirstLabel: `${ny}年${nm}月${nextMonthFirst.getDate()}日`,
  };
}

interface OptionContractsCardProps {
  memberId: string;
  isOnLeave: boolean;
  isRetirePending: boolean;
  hasUnpaidFee: boolean;
}

type TargetOption = { id: string; name: string; monthly_fee: number };

export function OptionContractsCard({
  memberId,
  isOnLeave,
  isRetirePending,
  hasUnpaidFee,
}: OptionContractsCardProps) {
  const queryClient = useQueryClient();

  // Add sheet state
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [optionTiming, setOptionTiming] = useState('今日から');

  // Change sheet state
  const [showChangeSheet, setShowChangeSheet] = useState(false);
  const [targetOption, setTargetOption] = useState<TargetOption | null>(null);
  const [optionChangeToId, setOptionChangeToId] = useState('');

  // Cancel sheet state
  const [showCancelSheet, setShowCancelSheet] = useState(false);
  const [optionCancelTiming, setOptionCancelTiming] = useState('即時解約');
  const [optionCancelReason, setOptionCancelReason] = useState('');

  const { data: optionContracts } = useQuery(
    getCrmMembersByIdContractsOptionContractsOptions({
      path: { id: memberId },
    }),
  );

  // const optionAddBlocked = isOnLeave || isRetirePending || hasUnpaidFee;
  // const optionEditBlocked = isOnLeave || isRetirePending;

  const { data: memberData } = useQuery(
    getCrmMembersByIdOptions({
      path: { id: memberId },
    }),
  );
  const storeId = memberData?.profile.store_id;
  const { data: storeOptionsData, isLoading: isStoreOptionsLoading } = useQuery({
    ...getCrmStoresByIdOptionsOptions({
      path: { id: storeId ?? '' },
    }),
    enabled: Boolean(storeId) && showAddSheet,
  });
  const allAvailableOptions =
    storeOptionsData?.options.map((option) => ({
      value: option.id,
      label: option.name,
      price: option.price_including_tax,
      description: option.related_option_name ?? '',
    })) ?? [];
  const contractedOptionNames = optionContracts?.map((o) => o.name) ?? [];
  const availableOptions = allAvailableOptions.filter(
    (o) => !contractedOptionNames.includes(o.label),
  );

  const { todayLabel, nextMonthLabel, nextMonthFirstLabel } = getDateLabels();

  const selectedOptionData = allAvailableOptions.find((o) => o.value === selectedOptionId);

  const invalidateContractQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: getCrmMembersByIdContractsOptionContractsQueryKey({
        path: { id: memberId },
      }),
    });
  };

  const { mutate: submitAddOption, isPending: isAddingOption } = useMutation({
    ...postCrmMembersByIdContractsOptionContractsMutation(),
    onSuccess: async () => {
      await invalidateContractQueries();
      setShowAddSheet(false);
      setSelectedOptionId('');
      setOptionTiming('今日から');
    },
  });

  const { mutate: submitChangeOption, isPending: isChangingOption } = useMutation({
    ...patchCrmMembersByIdContractsOptionContractsChangeMutation(),
    onSuccess: async () => {
      await invalidateContractQueries();
      setShowChangeSheet(false);
      setTargetOption(null);
      setOptionChangeToId('');
    },
  });

  const { mutate: submitCancelOption, isPending: isCancellingOption } = useMutation({
    ...patchCrmMembersByIdContractsOptionContractsCancelMutation(),
    onSuccess: async () => {
      await invalidateContractQueries();
      setShowCancelSheet(false);
      setTargetOption(null);
      setOptionCancelTiming('即時解約');
      setOptionCancelReason('');
    },
  });

  const handleOptionAdd = () => {
    setSelectedOptionId('');
    setOptionTiming('今日から');
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
            <CardTitle className="text-sm">オプション契約</CardTitle>
            <Button
              variant="outline"
              size="sm"
              // disabled={optionAddBlocked}
              onClick={handleOptionAdd}
            >
              + 追加
            </Button>
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
        {hasUnpaidFee && !isOnLeave && !isRetirePending && (
          <div className="px-4 pb-3">
            <Alert className="border-destructive/30 bg-destructive/10">
              <AlertDescription className="text-destructive text-xs">
                未納金があるため、追加費用が発生するオプション追加はできません
              </AlertDescription>
            </Alert>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-semibold">オプション名</TableHead>
              <TableHead className="text-right text-xs font-semibold">月額</TableHead>
              <TableHead className="text-xs font-semibold">適用開始日</TableHead>
              <TableHead className="text-xs font-semibold">次回請求日</TableHead>
              <TableHead className="w-10 text-xs font-semibold" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {optionContracts && optionContracts.length > 0 ? (
              optionContracts.map((opt) => (
                <TableRow key={opt.id}>
                  <TableCell className="text-sm font-medium">{opt.name}</TableCell>
                  <TableCell className="text-right text-sm">{formatYen(opt.monthly_fee)}</TableCell>
                  <TableCell className="text-sm">{formatDate(opt.start_date)}</TableCell>
                  <TableCell className="text-sm">{formatDate(opt.next_billing_date)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-md">
                        <MoreHorizontal className="text-muted-foreground size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          // disabled={optionEditBlocked}
                          onSelect={() =>
                            // !optionEditBlocked &&
                            setTimeout(
                              () =>
                                handleOptionChange({
                                  id: opt.id,
                                  name: opt.name,
                                  monthly_fee: opt.monthly_fee,
                                }),
                              100,
                            )
                          }
                        >
                          変更
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          // disabled={optionEditBlocked}
                          onSelect={() =>
                            // !optionEditBlocked &&
                            setTimeout(
                              () =>
                                handleOptionCancel({
                                  id: opt.id,
                                  name: opt.name,
                                  monthly_fee: opt.monthly_fee,
                                }),
                              100,
                            )
                          }
                        >
                          解約
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
      </Card>

      {/* オプション変更 Sheet */}
      <Sheet open={showChangeSheet} onOpenChange={setShowChangeSheet}>
        <SheetContent className="flex w-[420px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[420px]">
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
                    ? `${targetOption.name}　${formatYen(targetOption.monthly_fee)}/月`
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
                >
                  <SelectTrigger id="option-change-to" className="h-9 text-sm">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {allAvailableOptions
                      .filter((o) => o.value !== targetOption?.id)
                      .map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}　¥{o.price.toLocaleString()}/月
                        </SelectItem>
                      ))}
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

      {/* オプション解約 Sheet */}
      <Sheet open={showCancelSheet} onOpenChange={setShowCancelSheet}>
        <SheetContent className="flex w-[420px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[420px]">
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
                    ? `${targetOption.name}　${formatYen(targetOption.monthly_fee)}/月`
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

      {/* オプション追加 Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent className="flex w-[420px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[420px]">
          <div className="shrink-0 border-b px-6 py-4">
            <SheetHeader className="gap-0 p-0">
              <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                <Plus className="size-4" />
                オプション追加
              </SheetTitle>
              <SheetDescription className="sr-only">オプション追加フォーム</SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6">
            {hasUnpaidFee && (
              <div className="pt-4">
                <Alert className="border-destructive/30 bg-destructive/10">
                  <AlertDescription className="text-destructive text-xs">
                    未納金があるため追加費用が発生する操作はできません。
                  </AlertDescription>
                </Alert>
              </div>
            )}

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
                          {o.label}　¥{o.price.toLocaleString()}/月
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
                      ¥{selectedOptionData.price.toLocaleString()}/月
                    </p>
                  </div>
                  <p className="text-muted-foreground text-xs">{selectedOptionData.description}</p>
                </div>
              )}
            </div>

            <Separator className="-mx-6 w-[calc(100%+48px)]" />

            <div className="flex flex-col gap-3 py-4">
              <Label className="text-sm font-medium">開始タイミング</Label>
              <RadioGroup
                value={optionTiming}
                onValueChange={setOptionTiming}
                className="flex flex-col gap-2"
              >
                <label
                  htmlFor="timing-today"
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                    optionTiming === '今日から' ? 'border-primary bg-primary/10' : 'border-border'
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
                    optionTiming === '翌月から' ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <RadioGroupItem id="timing-next" value="翌月から" className="mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">翌月から</span>
                    <span className="text-muted-foreground text-xs">{nextMonthLabel}</span>
                  </div>
                </label>
              </RadioGroup>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-t px-6 py-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowAddSheet(false)}>
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={hasUnpaidFee || !selectedOptionId || isAddingOption}
              onClick={() => {
                submitAddOption({
                  path: { id: memberId },
                  body: {
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
