'use client';

// Client component: router navigation and React Query hooks require the browser.
import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Receipt } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

import { getCrmBillingRecordsReceivablesByMemberIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { UnpaidContractType } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  formatYen,
  getReceivableStatusBadgeClass,
  getReceivableStatusLabel,
} from '../_utils/receivable-status.util';
import type { BadDebtDialogMode } from './bad-debt-exclusion-dialog';

const CONTRACT_TYPE_LABELS: Record<UnpaidContractType, string> = {
  main: '主契約',
  option: 'オプション',
  ad_hoc: '都度請求',
};

interface UnpaidDetailSheetProps {
  memberId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssueConvenience: (memberId: string, memberName: string, lineItemIds?: string[]) => void;
  onBadDebtAction: (
    memberId: string,
    memberName: string,
    mode: BadDebtDialogMode,
    lineItemIds?: string[],
  ) => void;
}

export function UnpaidDetailSheet({
  memberId,
  open,
  onOpenChange,
  onIssueConvenience,
  onBadDebtAction,
}: Readonly<UnpaidDetailSheetProps>) {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    ...getCrmBillingRecordsReceivablesByMemberIdOptions({
      path: { memberId: memberId ?? '' },
    }),
    enabled: open && !!memberId,
  });

  const isExcluded = data?.receivable_status === 'bad_debt_excluded';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-140 flex-col gap-0 overflow-hidden p-0 sm:max-w-140">
        {isLoading && (
          <div className="space-y-3 p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {!isLoading && data && memberId && (
          <>
            <div className="shrink-0 border-b px-6 py-4">
              <SheetHeader className="gap-1 p-0">
                <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Receipt className="size-4 shrink-0" />
                  <span className="shrink-0">未納金 #{memberId}</span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 px-1 py-0 text-[10px] ${getReceivableStatusBadgeClass(data.receivable_status)}`}
                  >
                    {getReceivableStatusLabel(data.receivable_status)}
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-muted-foreground m-0 flex items-center gap-2 text-xs font-normal">
                  <span className="truncate">{data.member_name}</span>
                  <span className="text-muted-foreground/50 shrink-0">・</span>
                  <span className="text-[11px]">{data.store_name}</span>
                </SheetDescription>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-3 py-4">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  会員情報
                </h4>
                <div className="divide-y overflow-hidden rounded-md border text-xs">
                  <div className="grid grid-cols-[96px_1fr]">
                    <span className="bg-muted/40 text-muted-foreground px-3 py-2">店舗</span>
                    <span className="px-3 py-2">{data.store_name}</span>
                  </div>
                  <div className="grid grid-cols-[96px_1fr]">
                    <span className="bg-muted/40 text-muted-foreground px-3 py-2">会員ID</span>
                    <span
                      className="text-primary cursor-pointer px-3 py-2 font-mono hover:underline hover:underline-offset-2"
                      onClick={() => router.push(navigate('/members/[id]', memberId))}
                    >
                      {memberId}
                    </span>
                  </div>
                  <div className="grid grid-cols-[96px_1fr]">
                    <span className="bg-muted/40 text-muted-foreground px-3 py-2">氏名</span>
                    <span
                      className="text-primary cursor-pointer px-3 py-2 font-medium hover:underline hover:underline-offset-2"
                      onClick={() => router.push(navigate('/members/[id]', memberId))}
                    >
                      {data.member_name}
                    </span>
                  </div>
                  <div className="grid grid-cols-[96px_1fr]">
                    <span className="bg-muted/40 text-muted-foreground px-3 py-2">決済手段</span>
                    {/* The by-member API response has no top-level payment_method (only per line
                        item); derive from the first line item, mirroring how the list endpoint
                        derives its own payment_method from the member's first billing record. */}
                    <span className="px-3 py-2 text-xs uppercase">
                      {data.line_items[0]?.payment_method ?? '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[96px_1fr]">
                    <span className="bg-muted/40 text-muted-foreground px-3 py-2">未納総額</span>
                    <span className="text-destructive px-3 py-2 font-semibold tabular-nums">
                      {formatYen(data.total_unpaid_amount)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator className="-mx-6 w-[calc(100%+48px)]" />

              <div className="space-y-3 py-4">
                <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  未納明細
                </h4>
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="px-3 py-2 text-xs font-semibold">明細ID</TableHead>
                        <TableHead className="px-3 py-2 text-xs font-semibold">月</TableHead>
                        <TableHead className="px-3 py-2 text-xs font-semibold">契約種別</TableHead>
                        <TableHead className="px-3 py-2 text-xs font-semibold">契約名</TableHead>
                        <TableHead className="px-3 py-2 text-right text-xs font-semibold">
                          金額
                        </TableHead>
                        <TableHead className="px-3 py-2 text-xs font-semibold">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="px-3 py-2">
                            <span className="text-muted-foreground font-mono text-[10px]">
                              {item.id}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <Badge
                              variant="outline"
                              className="border-warning/40 text-warning bg-warning/15 px-1 py-0 text-[10px]"
                            >
                              {item.month}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <span className="text-xs">
                              {CONTRACT_TYPE_LABELS[item.contract_type]}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2">
                            <div className="flex flex-wrap items-center gap-1">
                              <span className="text-xs">{item.contract_name}</span>
                              {item.contract_type === 'main' &&
                                item.jaccs_subrogation_eligible === true && (
                                  <Badge
                                    variant="outline"
                                    className="bg-info/15 text-info border-info/20 px-1 py-0 text-[10px]"
                                  >
                                    代位弁済対象
                                  </Badge>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-2 text-right">
                            <span className="text-xs font-medium tabular-nums">
                              {formatYen(item.amount)}
                            </span>
                          </TableCell>
                          <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex size-6 items-center justify-center rounded-md">
                                <MoreHorizontal className="size-3" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <RoleGatedMenuItem
                                  requiredPermission={Permission.SalesConvenienceIssue}
                                  onClick={() =>
                                    onIssueConvenience(memberId, data.member_name, [item.id])
                                  }
                                >
                                  コンビニ決済URL発行
                                </RoleGatedMenuItem>
                                {item.status === 'bad_debt_excluded' ? (
                                  <RoleGatedMenuItem
                                    requiredPermission={Permission.SalesBadDebtExclude}
                                    onClick={() =>
                                      onBadDebtAction(memberId, data.member_name, 'release', [
                                        item.id,
                                      ])
                                    }
                                  >
                                    貸倒対象外指定の解除
                                  </RoleGatedMenuItem>
                                ) : (
                                  <RoleGatedMenuItem
                                    requiredPermission={Permission.SalesBadDebtExclude}
                                    onClick={() =>
                                      onBadDebtAction(memberId, data.member_name, 'exclude', [
                                        item.id,
                                      ])
                                    }
                                  >
                                    貸倒対象外指定
                                  </RoleGatedMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t px-6 py-4">
              <RoleGatedButton
                requiredPermission={Permission.SalesConvenienceIssue}
                denyTooltip="コンビニ決済URL発行の権限がありません"
                size="sm"
                className="h-9 w-full"
                onClick={() => onIssueConvenience(memberId, data.member_name)}
              >
                コンビニ決済URLを一括発行
              </RoleGatedButton>
              {isExcluded ? (
                <RoleGatedButton
                  requiredPermission={Permission.SalesBadDebtExclude}
                  denyTooltip="貸倒対象外指定解除の権限がありません"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full"
                  onClick={() => onBadDebtAction(memberId, data.member_name, 'release')}
                >
                  貸倒対象外指定を一括解除
                </RoleGatedButton>
              ) : (
                <RoleGatedButton
                  requiredPermission={Permission.SalesBadDebtExclude}
                  denyTooltip="貸倒対象外指定の権限がありません"
                  variant="outline"
                  size="sm"
                  className="h-9 w-full"
                  onClick={() => onBadDebtAction(memberId, data.member_name, 'exclude')}
                >
                  貸倒対象外に一括指定
                </RoleGatedButton>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
