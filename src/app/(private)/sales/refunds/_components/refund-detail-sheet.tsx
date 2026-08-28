'use client';

import Link from 'next/link';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { ChevronRight, ShieldAlert } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import type { RefundQueueEntry, StaffRole } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { canApproveRefund, requiredApproverLabel } from '@/lib/utils/refund-approval';

import { Permission } from '@/types/permission.type';

import {
  PAYMENT_METHOD_LABELS,
  REFUND_STATUS_LABELS,
  REQUESTER_ROLE_BADGE_LABELS,
  formatYen,
  getRefundStatusBadgeClasses,
} from './refund-queue-table';

/** Text-label variant (Staff/Manager/Headquarter) used in explanatory copy — mirrors the mock's phrasing. */
const REQUESTER_ROLE_TEXT_LABELS: Record<RefundQueueEntry['requester_role'], string> = {
  staff: 'Staff',
  manager: 'Manager',
  headquarter: 'Headquarter',
};

interface RefundDetailSheetProps {
  entry: RefundQueueEntry | null;
  open: boolean;
  onClose: () => void;
  currentRole: StaffRole;
  onDecide: (decision: 'approve' | 'reject') => void;
}

/** FR-014/FR-016/FR-017: refund request detail panel with hierarchy-gated approve/reject actions. */
export function RefundDetailSheet({
  entry,
  open,
  onClose,
  currentRole,
  onDecide,
}: Readonly<RefundDetailSheetProps>) {
  if (!entry) return null;

  const isPending = entry.status === 'pending';
  const canApprove = canApproveRefund(currentRole, entry.requester_role);
  const requiredLabel = requiredApproverLabel(entry.requester_role);
  const isPartialRefund = entry.refund_amount < entry.sale_amount;
  const hierarchyDenyMessage = !canApprove
    ? `${REQUESTER_ROLE_TEXT_LABELS[entry.requester_role]}申請には${requiredLabel}が必要です`
    : undefined;

  return (
    <Sheet open={open} onOpenChange={(value) => !value && onClose()}>
      <SheetContent className="flex w-[480px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]">
        <div className="shrink-0 border-b px-6 py-4">
          <SheetHeader className="gap-0 p-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              返金申請 #{entry.refund_id}
              <Badge
                variant="outline"
                className={`px-1 py-0 text-[10px] ${getRefundStatusBadgeClasses(entry.status)}`}
              >
                {REFUND_STATUS_LABELS[entry.status]}
              </Badge>
            </SheetTitle>
            <SheetDescription className="sr-only">返金申請の詳細情報</SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* 返金対象 */}
          <div className="space-y-3 px-6 py-4">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              返金対象
            </h4>
            <div className="divide-y overflow-hidden rounded-md border text-xs">
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">会員名</span>
                <span className="px-3 py-2 font-medium">
                  {entry.member_name}（ID: {entry.member_id}）
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">店舗</span>
                <span className="px-3 py-2">{entry.store_name}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">対象商品</span>
                <span className="px-3 py-2">{entry.product_name}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">売上ID</span>
                <Link
                  href={navigate('/sales/[id]', entry.billing_record_id)}
                  className="text-info flex items-center gap-1 px-3 py-2 font-mono hover:underline"
                >
                  #{entry.billing_record_id}
                  <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">決済方法</span>
                <span className="px-3 py-2">{PAYMENT_METHOD_LABELS[entry.payment_method]}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">売上額</span>
                <span className="px-3 py-2 tabular-nums">{formatYen(entry.sale_amount)}</span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">返金額</span>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="font-medium tabular-nums">{formatYen(entry.refund_amount)}</span>
                  {isPartialRefund && (
                    <Badge
                      variant="outline"
                      className="bg-info/15 text-info border-info/20 px-1 py-0 text-[10px]"
                    >
                      部分返金
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 申請情報 */}
          <div className="space-y-3 px-6 py-4">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              申請情報
            </h4>
            <div className="divide-y overflow-hidden rounded-md border text-xs">
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">申請者</span>
                <span className="px-3 py-2">
                  {entry.requester_name}（ID: {entry.requester_id}）
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">申請者ロール</span>
                <div className="flex flex-wrap items-center gap-2 px-3 py-2">
                  <Badge
                    variant="outline"
                    className="bg-muted/60 text-muted-foreground border-border px-1 py-0 text-[10px]"
                  >
                    {REQUESTER_ROLE_BADGE_LABELS[entry.requester_role]}
                  </Badge>
                  <span className="text-muted-foreground text-[10px]">
                    承認には{requiredLabel}が必要
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">申請日時</span>
                <span className="px-3 py-2">
                  {formatDateYYYYMMDD_HHMM(entry.requested_at, '-')}
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <span className="bg-muted/40 text-muted-foreground px-3 py-2">返金理由</span>
                <span className="px-3 py-2 leading-relaxed">{entry.reason}</span>
              </div>
            </div>
          </div>

          {/* 承認情報（返金済み/却下の場合） */}
          {entry.approver_name && (
            <div className="space-y-3 px-6 py-4">
              <h4 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                承認情報
              </h4>
              <div className="divide-y overflow-hidden rounded-md border text-xs">
                <div className="grid grid-cols-[120px_1fr]">
                  <span className="bg-muted/40 text-muted-foreground px-3 py-2">承認者</span>
                  <span className="px-3 py-2">
                    {entry.approver_name}（ID: {entry.approver_id}）
                  </span>
                </div>
                <div className="grid grid-cols-[120px_1fr]">
                  <span className="bg-muted/40 text-muted-foreground px-3 py-2">承認日時</span>
                  <span className="px-3 py-2">
                    {formatDateYYYYMMDD_HHMM(entry.approved_at, '-')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: 承認待ちのみ承認/否認アクションを表示 */}
        {isPending && (
          <div className="shrink-0 space-y-3 border-t px-6 py-4">
            {!canApprove && (
              <Alert className="bg-warning/10 border-warning/20">
                <ShieldAlert className="text-warning size-4" />
                <AlertDescription className="text-warning text-xs">
                  この申請の承認権限がありません（
                  {REQUESTER_ROLE_TEXT_LABELS[entry.requester_role]}申請には{requiredLabel}
                  が必要）
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-end gap-2">
              <RoleGatedButton
                requiredPermission={Permission.SalesRefundApprove}
                denyTooltip="返金承認の権限がありません"
                tooltip={hierarchyDenyMessage}
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                disabled={!canApprove}
                onClick={() => onDecide('reject')}
              >
                否認する
              </RoleGatedButton>
              <RoleGatedButton
                requiredPermission={Permission.SalesRefundApprove}
                denyTooltip="返金承認の権限がありません"
                tooltip={hierarchyDenyMessage}
                size="sm"
                disabled={!canApprove}
                onClick={() => onDecide('approve')}
              >
                承認する
              </RoleGatedButton>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
