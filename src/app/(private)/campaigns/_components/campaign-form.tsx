'use client';

import { AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { CampaignFormAutoGrantSettings } from './campaign-form-auto-grant-settings';
import { CampaignFormBasicInfo } from './campaign-form-basic-info';
import { CampaignFormDiscountSettings } from './campaign-form-discount-settings';
import { CampaignFormMainContract } from './campaign-form-main-contract';
import { CampaignFormPeriodSettings } from './campaign-form-period-settings';
import { CampaignFormStatus } from './campaign-form-status';

interface CampaignFormProps {
  isEdit?: boolean;
  isSubmitting?: boolean;
  campaignId?: string;
  onCancel: () => void;
}

export function CampaignForm({
  isEdit = false,
  isSubmitting = false,
  campaignId,
  onCancel,
}: Readonly<CampaignFormProps>) {
  return (
    <div className="flex flex-col gap-6">
      {isEdit && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="text-warning size-4" />
          <AlertDescription className="text-muted-foreground text-xs">
            実施中のキャンペーンを変更すると、適用中の会員にも影響します。
          </AlertDescription>
        </Alert>
      )}

      <CampaignFormBasicInfo isEdit={isEdit} campaignId={campaignId} />
      <CampaignFormPeriodSettings />
      <CampaignFormMainContract />
      <CampaignFormDiscountSettings />
      <CampaignFormAutoGrantSettings />
      <CampaignFormStatus />

      <div className="flex items-center justify-end gap-2 border-t p-4">
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </Button>
      </div>
    </div>
  );
}
