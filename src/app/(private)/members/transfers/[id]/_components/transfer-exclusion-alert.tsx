'use client';

import { useState } from 'react';

import Link from 'next/link';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { AlertTriangle, Check } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import type { TransferDetail } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { TransferUnlockDialog } from './transfer-unlock-dialog';

/**
 * JOYFIT auto-transfer exclusion alerts (FR-006, FR-012).
 *
 * Three states, of which at most two render at once:
 * - 未納 — destructive, with no override control. A balance has to be settled, not waived.
 * - 縛り期間中 — warning, with the admin-only manual release.
 * - 手動解除済み — success, replacing the campaign-lock alert once released.
 *
 * A row carrying both reasons keeps the unpaid alert after unlocking, because unlock releases
 * only the campaign lock.
 */
export function TransferExclusionAlert({ transfer }: Readonly<{ transfer: TransferDetail }>) {
  const [unlockOpen, setUnlockOpen] = useState(false);

  if (transfer.brand !== 'joyfit') return null;

  const reasons = transfer.exclusion_reasons;
  const isUnpaid = reasons.includes('unpaid');
  const isCampaignLocked = reasons.includes('campaign_lock');
  const unlock = transfer.unlock;

  // Nothing to report: eligible from the start, and never overridden.
  if (!isUnpaid && !isCampaignLocked && !unlock) return null;

  return (
    <div className="mb-4 flex flex-col gap-2">
      {isUnpaid && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle className="text-sm font-semibold">自動移籍 除外: 未納金あり</AlertTitle>
          <AlertDescription className="text-sm">
            未納金 ¥{(transfer.unpaid_amount ?? 0).toLocaleString()}
            {transfer.unpaid_period && `（${transfer.unpaid_period}）`}
            が未解消です。解消後に再申請してください。
            <Button
              nativeButton={false}
              variant="link"
              size="sm"
              className="text-destructive ml-2 h-auto p-0 text-xs underline"
              render={
                <Link href={navigate('/members/[id]', transfer.member_id, { tab: 'payment' })} />
              }
            >
              売上詳細を確認
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {unlock ? (
        <Alert className="border-success/50 bg-success/15 text-success">
          <Check className="text-success size-4" />
          <AlertTitle className="text-sm font-semibold">管理者により手動解除済み</AlertTitle>
          <AlertDescription className="text-success/90 text-sm">
            <span className="block">解除理由: {unlock.reason}</span>
            <span className="block">
              実行者: {unlock.operator_name} / {formatDateYYYYMMDD_HHMM(unlock.unlocked_at)}
            </span>
            <span className="mt-1 block">移籍を進められる状態です。</span>
          </AlertDescription>
        </Alert>
      ) : (
        isCampaignLocked && (
          <Alert className="border-warning/50 bg-warning/15 text-warning">
            <AlertTriangle className="text-warning size-4" />
            <AlertTitle className="text-sm font-semibold">
              自動移籍 除外: キャンペーン縛り期間中（解約手数料期間）
            </AlertTitle>
            <AlertDescription className="text-warning/90 text-sm">
              <span className="block">
                キャンペーン縛り期間が残り {transfer.campaign_lock_remaining_days ?? 0}日
                あります。縛り期間終了後に再申請してください。
              </span>
              <span className="mt-2 block">
                <RoleGatedButton
                  requiredPermission={Permission.MembersTransfersUnlock}
                  denyTooltip="手動解除は管理者権限が必要です"
                  variant="outline"
                  size="sm"
                  className="border-warning/60 text-warning hover:bg-warning/20 hover:text-warning h-7 text-xs"
                  onClick={() => setUnlockOpen(true)}
                >
                  管理者権限で手動解除して移籍を通す
                </RoleGatedButton>
              </span>
            </AlertDescription>
          </Alert>
        )
      )}

      <TransferUnlockDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        transferId={transfer.id}
      />
    </div>
  );
}
