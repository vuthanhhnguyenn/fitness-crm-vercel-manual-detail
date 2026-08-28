'use client';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { Ban, Check, Copy, MoreHorizontal } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  PROMO_CODE_INACTIVE_STATUSES,
  PROMO_CODE_SCOPE_LABELS,
  PROMO_CODE_STATUS_BADGE_CLASSES,
  PROMO_CODE_STATUS_LABELS,
} from '../../_constants/constants';
import type { PromoCodesTabHook } from '../_hooks/use-promo-codes-tab';

const DASH = '—';

export function PromoCodeTable({ tab }: Readonly<{ tab: PromoCodesTabHook }>) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="min-w-[160px] text-xs font-semibold">コード</TableHead>
          <TableHead className="min-w-[180px] text-xs font-semibold">説明</TableHead>
          <TableHead className="min-w-[180px] text-xs font-semibold">有効期間</TableHead>
          <TableHead className="w-[130px] text-xs font-semibold">使用済み / 使用上限</TableHead>
          <TableHead className="w-[80px] text-xs font-semibold">残数</TableHead>
          <TableHead className="w-[80px] text-xs font-semibold">使用率</TableHead>
          <TableHead className="w-[120px] text-xs font-semibold">適用店舗</TableHead>
          <TableHead className="w-[110px] text-xs font-semibold">ステータス</TableHead>
          <TableHead className="w-10 text-xs font-semibold" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tab.promoCodes.map((promoCode) => (
          <TableRow
            key={promoCode.id}
            className={cn(
              PROMO_CODE_INACTIVE_STATUSES.includes(promoCode.effectiveStatus) && 'opacity-60',
            )}
          >
            <TableCell>
              <div className="flex items-center gap-2">
                <code className="bg-muted rounded px-2 py-1 font-mono text-xs">
                  {promoCode.code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-6 p-0"
                  onClick={() => tab.copyCode(promoCode.code)}
                  aria-label="コードをコピー"
                >
                  {tab.copiedCode === promoCode.code ? (
                    <Check className="text-success size-3" />
                  ) : (
                    <Copy className="text-muted-foreground size-3" />
                  )}
                </Button>
              </div>
            </TableCell>
            <TableCell
              className="max-w-[280px] truncate text-xs"
              title={promoCode.description ?? undefined}
            >
              {promoCode.description ?? DASH}
            </TableCell>
            <TableCell className="text-xs">
              {formatDateYYYYMMDD(promoCode.validFrom)} 〜 {formatDateYYYYMMDD(promoCode.validTo)}
            </TableCell>
            <TableCell className="text-xs">
              <span className="font-medium">{promoCode.usedCount}</span>
              <span className="text-muted-foreground">
                {' / '}
                {promoCode.maxUses === null ? '無制限' : `${promoCode.maxUses}回`}
              </span>
            </TableCell>
            <TableCell className="text-xs font-medium">
              {promoCode.remaining === null ? (
                <span className="text-muted-foreground">{DASH}</span>
              ) : (
                promoCode.remaining
              )}
            </TableCell>
            <TableCell className="text-xs font-medium">
              {promoCode.usageRate === null ? (
                <span className="text-muted-foreground">{DASH}</span>
              ) : (
                `${promoCode.usageRate}%`
              )}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="text-[10px]">
                {PROMO_CODE_SCOPE_LABELS[promoCode.scopeType]}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  PROMO_CODE_STATUS_BADGE_CLASSES[promoCode.effectiveStatus],
                )}
              >
                {PROMO_CODE_STATUS_LABELS[promoCode.effectiveStatus]}
              </Badge>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="hover:bg-muted flex size-8 items-center justify-center rounded-md"
                  aria-label="promo code actions"
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* G-06 FR-007 途中無効化: 理由必須の確認ダイアログを開く */}
                  <RoleGatedMenuItem
                    requiredPermission={Permission.CampaignsPromoCodeDelete}
                    className="text-destructive"
                    disabled={promoCode.status === 'disabled'}
                    onClick={() => tab.setDisableTarget(promoCode)}
                  >
                    <Ban className="size-4" />
                    無効化
                  </RoleGatedMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
