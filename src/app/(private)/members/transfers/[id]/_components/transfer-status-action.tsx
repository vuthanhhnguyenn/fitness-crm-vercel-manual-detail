'use client';

import { useState } from 'react';

import { formatDateYYYYMMDD_HHMM } from '@/utils/date.util';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { StatusCard } from '@/components/common/status-card';

import type { TransferDetail } from '@/lib/api/types.gen';
import { TransferStatus } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  TRANSFER_STATUS_ICONS,
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_TONES,
  isTransferPending,
} from '../../_constants/constants';
import { TransferApproveDialog } from './transfer-approve-dialog';
import { TransferRejectDialog } from './transfer-reject-dialog';

interface Props {
  transfer: TransferDetail;
}

/**
 * Status hub + the approve / reject actions.
 *
 * The pre-update version decoded the session JWT in the browser and **defaulted to
 * `headquarter`** whenever that failed, so an unauthenticated or malformed session was silently
 * promoted to full approval rights. That path is gone: the permission check comes from
 * `RoleGatedButton` and the row-level decision arrives from the server as `transfer.can_act`.
 */
export function TransferStatusAction({ transfer }: Readonly<Props>) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const isFit365WaitingDestination =
    transfer.brand === 'fit365' && transfer.status === TransferStatus.FROM_STORE_APPROVED;

  const meta = [
    `申請日: ${formatDateYYYYMMDD_HHMM(transfer.applied_at)}`,
    `最終更新: ${formatDateYYYYMMDD_HHMM(transfer.updated_at)}`,
    ...(isFit365WaitingDestination ? ['移籍先店舗の承認待ちです'] : []),
  ];

  const notThisStoreTooltip = transfer.can_act ? undefined : 'この申請の担当店舗ではありません';

  return (
    <>
      <div className="sticky top-6 flex flex-col gap-4">
        <StatusCard
          tone={TRANSFER_STATUS_TONES[transfer.status]}
          icon={TRANSFER_STATUS_ICONS[transfer.status]}
          label={TRANSFER_STATUS_LABELS[transfer.status]}
          meta={meta}
          action={
            // A decided transfer offers no actions at all — not disabled ones.
            isTransferPending(transfer.status) ? (
              <div className="flex w-full flex-col gap-2">
                <RoleGatedButton
                  requiredPermission={Permission.MembersTransfersApprove}
                  denyTooltip="移籍承認の権限がありません"
                  tooltip={notThisStoreTooltip}
                  disabled={!transfer.can_act}
                  size="sm"
                  fullWidth
                  onClick={() => setApproveOpen(true)}
                >
                  {isFit365WaitingDestination ? '移籍先として承認' : '承認'}
                </RoleGatedButton>
                <RoleGatedButton
                  requiredPermission={Permission.MembersTransfersApprove}
                  denyTooltip="移籍却下の権限がありません"
                  tooltip={notThisStoreTooltip}
                  disabled={!transfer.can_act}
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRejectOpen(true)}
                >
                  却下
                </RoleGatedButton>
              </div>
            ) : undefined
          }
        />
      </div>

      <TransferApproveDialog open={approveOpen} onOpenChange={setApproveOpen} transfer={transfer} />
      <TransferRejectDialog open={rejectOpen} onOpenChange={setRejectOpen} transfer={transfer} />
    </>
  );
}
