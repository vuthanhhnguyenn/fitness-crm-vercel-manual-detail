'use client';

import { Ban, Check, Copy, MoreHorizontal, Pencil } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
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

import { Permission } from '@/types/permission.type';

import { PROMO_CODE_STATUS_LABELS } from '../_constants/promo-code.constants';

export type PromoCodeListRowStatus = 'active' | 'expired' | 'limit_reached' | 'inactive';

export interface PromoCodeListRow {
  code: string;
  description: string | null;
  campaignName: string;
  validFrom: string;
  validTo: string;
  usageCount: number | null;
  usageCap: number | null;
  usageCapLabel: string;
  storeScopeLabel: string;
  issuedByLabel: string;
  discountTotalLabel: string;
  status: PromoCodeListRowStatus;
}

interface PromoCodeTableProps {
  rows: PromoCodeListRow[];
  copiedCode: string | null;
  onCopyCode: (code: string) => void;
  onRequestDisable: (row: PromoCodeListRow) => void;
}

const STATUS_CLASS_NAMES: Record<PromoCodeListRowStatus, string> = {
  active: 'border-success/20 bg-success/15 text-success',
  expired: 'border-warning/20 bg-warning/15 text-warning',
  limit_reached: 'border-destructive/20 bg-destructive/15 text-destructive',
  inactive: 'border-border bg-muted text-muted-foreground',
};

function formatCount(value: number | null): string {
  return value === null ? '—' : value.toLocaleString();
}

export function PromoCodeTable({
  rows,
  copiedCode,
  onCopyCode,
  onRequestDisable,
}: PromoCodeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="min-w-[160px] text-xs font-semibold">コード</TableHead>
          <TableHead className="min-w-[180px] text-xs font-semibold">説明</TableHead>
          <TableHead className="min-w-[180px] text-xs font-semibold">
            有効期間（G-06 FR-004）
          </TableHead>
          <TableHead className="w-[120px] text-xs font-semibold">
            使用 / 有効数（G-06 FR-005）
          </TableHead>
          <TableHead className="w-[80px] text-xs font-semibold">残数</TableHead>
          <TableHead className="w-[120px] text-xs font-semibold">適用店舗（G-06）</TableHead>
          <TableHead className="w-[100px] text-xs font-semibold">ステータス</TableHead>
          <TableHead className="w-[120px] text-right text-xs font-semibold">
            <span className="inline-flex items-center gap-1">
              割引合計
              <span className="text-muted-foreground text-[9px] font-normal">(Phase 2)</span>
            </span>
          </TableHead>
          <TableHead className="w-10 text-xs font-semibold" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={9} className="text-muted-foreground py-10 text-center text-sm">
              条件に一致するプロモーションコードはありません。
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const statusClass = STATUS_CLASS_NAMES[row.status];
            const remaining =
              row.usageCap === null ? '—' : Math.max(0, row.usageCap - (row.usageCount ?? 0));
            const shouldDim =
              row.status === 'inactive' ||
              row.status === 'expired' ||
              row.status === 'limit_reached';

            return (
              <TableRow key={row.code} className={shouldDim ? 'opacity-60' : undefined}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted rounded px-2 py-1 font-mono text-xs">{row.code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      onClick={() => onCopyCode(row.code)}
                    >
                      {copiedCode === row.code ? (
                        <Check className="text-success size-3" />
                      ) : (
                        <Copy className="text-muted-foreground size-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {row.description ? (
                    row.description
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {row.validFrom} 〜 {row.validTo}
                </TableCell>
                <TableCell className="text-xs">
                  <span className="font-medium">{formatCount(row.usageCount)}</span>
                  <span className="text-muted-foreground"> / {row.usageCapLabel}</span>
                </TableCell>
                <TableCell className="text-xs font-medium">{remaining}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {row.storeScopeLabel}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${statusClass}`}>
                    {PROMO_CODE_STATUS_LABELS[row.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs font-medium">
                  {row.discountTotalLabel}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="hover:bg-muted flex size-8 items-center justify-center rounded-md">
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <RoleGatedMenuItem
                        requiredPermission={Permission.CampaignsPromoCodeEdit}
                        disabled
                      >
                        <Pencil className="size-4" />
                        編集
                      </RoleGatedMenuItem>
                      <DropdownMenuSeparator />
                      <RoleGatedMenuItem
                        requiredPermission={Permission.CampaignsPromoCodeDelete}
                        className="text-destructive"
                        disabled={row.status === 'inactive'}
                        onClick={() => onRequestDisable(row)}
                      >
                        <Ban className="size-4" />
                        無効化
                      </RoleGatedMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
