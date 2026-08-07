'use client';

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone } from 'lucide-react';
import { toast } from 'sonner';

import { StatusCard as StatusCardComponent } from '@/components/common/status-card';
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
import { Button } from '@/components/ui/button';

import {
  getCrmCampaignsByIdQueryKey,
  getCrmCampaignsQueryKey,
  patchCrmCampaignsByIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type { CampaignDetail, PatchCrmCampaignsByIdData } from '@/lib/api/types.gen';

type CampaignAcceptancePanelProps = {
  campaign: CampaignDetail;
};

function toRequestDate(value: string) {
  return value.replaceAll('/', '-');
}

export function CampaignAcceptancePanel({ campaign }: Readonly<CampaignAcceptancePanelProps>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [acceptEnabled, setAcceptEnabled] = useState(campaign.accept_status === 'active');

  const updateMutation = useMutation({
    ...patchCrmCampaignsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'キャンペーンを更新しました');
      setAcceptEnabled(response.campaign.accept_status === 'active');
      setOpen(false);
      queryClient.invalidateQueries({
        queryKey: getCrmCampaignsQueryKey(),
        refetchType: 'all',
      });
      queryClient.invalidateQueries({
        queryKey: getCrmCampaignsByIdQueryKey({ path: { id: campaign.id } }),
        refetchType: 'all',
      });
    },
    onError: () => {
      toast.error('受付状態の更新に失敗しました');
    },
  });

  const handleAcceptToggle = () => {
    const nextAcceptStatus = acceptEnabled ? 'inactive' : 'active';
    const requestBody: NonNullable<PatchCrmCampaignsByIdData['body']> = {
      name: campaign.name,
      code: campaign.code,
      brand: campaign.brand,
      note: campaign.note ?? null,
      accept_status: nextAcceptStatus,
      status: campaign.status ?? 'active',
      recruitment_period_start: toRequestDate(campaign.recruitment_period_start),
      recruitment_period_end: toRequestDate(campaign.recruitment_period_end),
      usage_period_start: toRequestDate(campaign.usage_period_start),
      usage_period_end: toRequestDate(campaign.usage_period_end),
      application_start_month_type: campaign.application_start_month_type,
      application_custom_month: campaign.application_custom_month,
      application_duration_months: campaign.application_duration_months,
      main_contract_id: campaign.main_contract_id,
      discount: {
        first_month_enabled: campaign.discount.first_month_enabled,
        second_month_enabled: campaign.discount.second_month_enabled,
        amount: campaign.discount.amount,
        rate: campaign.discount.rate,
      },
      auto_grant: {
        enabled: campaign.auto_grant.enabled,
        target_type: campaign.auto_grant.target_type,
        gender_conditions: campaign.auto_grant.gender_conditions,
        option_ids: campaign.auto_grant.option_ids,
      },
    };

    updateMutation.mutate({
      path: { id: campaign.id },
      body: requestBody,
    } as never);
  };

  return (
    <StatusCardComponent
      tone={acceptEnabled ? 'success' : 'muted'}
      icon={Megaphone}
      label={acceptEnabled ? '受付中' : '受付停止'}
      meta={[
        `募集期間: ${campaign.recruitment_period_start} 〜 ${campaign.recruitment_period_end}`,
        'OFFで入会フローから非表示',
      ]}
      action={
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-full rounded-[10px] px-4 text-sm font-medium"
              />
            }
          >
            {acceptEnabled ? '受付を停止する' : '受付を再開する'}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {acceptEnabled
                  ? 'このキャンペーンの受付を停止しますか？'
                  : 'このキャンペーンの受付を再開しますか？'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {acceptEnabled
                  ? '受付停止中は入会フローでこのキャンペーンが表示されなくなります。既存の適用会員への影響はありません。'
                  : '受付再開すると入会フローで再びこのキャンペーンが表示されます。'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updateMutation.isPending}>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={handleAcceptToggle} disabled={updateMutation.isPending}>
                {updateMutation.isPending
                  ? acceptEnabled
                    ? '停止中...'
                    : '再開中...'
                  : acceptEnabled
                    ? '停止する'
                    : '再開する'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      }
    />
  );
}
