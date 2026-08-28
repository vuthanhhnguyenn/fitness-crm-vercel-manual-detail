'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { StatusCard } from '@/components/common/status-card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import {
  getCrmCampaignsByIdChangeHistoryQueryKey,
  getCrmCampaignsByIdQueryKey,
  getCrmCampaignsQueryKey,
  patchCrmCampaignsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { CampaignDetailResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  CAMPAIGN_ACCEPT_STATE_LABELS,
  CAMPAIGN_ACCEPT_STATE_TONES,
} from '../../_constants/constants';
import { getCampaignErrorMessage } from '../../_utils/campaign-error';

type CampaignAcceptancePanelProps = {
  campaign: CampaignDetailResponse;
};

export function CampaignAcceptancePanel({ campaign }: Readonly<CampaignAcceptancePanelProps>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const capReached = campaign.acceptState === 'capacity_reached';
  const isAccepting = campaign.isAccepting;
  const remaining =
    campaign.entryCap === null
      ? null
      : Math.max(0, campaign.entryCap - campaign.stats.pendingApplicationCount);

  const updateMutation = useMutation({
    ...patchCrmCampaignsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'キャンペーンを更新しました', {
        description: isAccepting
          ? '入会フローでこのキャンペーンが表示されなくなりました'
          : '入会フローで再びこのキャンペーンが表示されます',
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: getCrmCampaignsQueryKey() });
      queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdQueryKey({ path: { id: campaign.id } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdChangeHistoryQueryKey({ path: { id: campaign.id } }),
      });
    },
    onError: (error) => {
      toast.error(getCampaignErrorMessage(error, '受付状態の更新に失敗しました'));
    },
  });

  const meta = [
    campaign.entryCap === null
      ? '先着件数上限: 未設定'
      : `先着件数上限: ${campaign.entryCap}件（申請 ${campaign.stats.pendingApplicationCount}件 / 残り ${remaining}件）`,
    `募集期間: ${campaign.recruitmentStart} 〜 ${campaign.recruitmentEnd}`,
    capReached
      ? '上限到達のためシステムが自動で受付可否フラグをOFFにしました'
      : 'OFFで入会フローから非表示',
  ];

  return (
    <StatusCard
      tone={CAMPAIGN_ACCEPT_STATE_TONES[campaign.acceptState]}
      icon={Megaphone}
      label={CAMPAIGN_ACCEPT_STATE_LABELS[campaign.acceptState]}
      meta={meta}
      action={
        capReached ? undefined : (
          <AlertDialog open={open} onOpenChange={setOpen}>
            {/* G-03 L236: 受付フラグ制御は System / Headquarter のみ */}
            <AlertDialogTrigger
              render={
                <RoleGatedButton
                  requiredPermission={Permission.CampaignsEdit}
                  variant="outline"
                  size="sm"
                  fullWidth
                >
                  {isAccepting ? '受付を停止する' : '受付を再開する'}
                </RoleGatedButton>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isAccepting
                    ? 'このキャンペーンの受付を停止しますか？'
                    : 'このキャンペーンの受付を再開しますか？'}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isAccepting
                    ? '受付停止中は入会フローでこのキャンペーンが表示されなくなります。既存の適用会員への影響はありません。'
                    : '受付再開すると入会フローで再びこのキャンペーンが表示されます。'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={updateMutation.isPending}>
                  キャンセル
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    updateMutation.mutate({
                      path: { id: campaign.id },
                      body: { isAccepting: !isAccepting },
                    })
                  }
                  disabled={updateMutation.isPending}
                >
                  {isAccepting ? '停止する' : '再開する'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      }
    />
  );
}
