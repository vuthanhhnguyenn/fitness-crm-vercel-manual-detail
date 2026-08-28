'use client';

import { useFormContext } from 'react-hook-form';

import { AlertTriangle } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { Permission } from '@/types/permission.type';

import type { CampaignFormValues } from '../_schemas/campaign-form.schema';
import { CampaignFormAutoGrantSettings } from './campaign-form-auto-grant-settings';
import { CampaignFormBasicInfo } from './campaign-form-basic-info';
import { CampaignFormDiscountSettings } from './campaign-form-discount-settings';
import { CampaignFormMainContract } from './campaign-form-main-contract';
import { CampaignFormPeriodSettings } from './campaign-form-period-settings';
import { CampaignFormPublishScope } from './campaign-form-publish-scope';
import { CampaignFormReferralSettings } from './campaign-form-referral-settings';
import { CampaignFormStatus } from './campaign-form-status';

interface CampaignFormProps {
  isEdit?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function CampaignForm({
  isEdit = false,
  isSubmitting = false,
  onCancel,
}: Readonly<CampaignFormProps>) {
  const form = useFormContext<CampaignFormValues>();
  const hasErrors = Object.keys(form.formState.errors).length > 0;

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      {/* 編集影響範囲の警告。フォーム自体は編集可能なままにし、適用中の場合は送信時にAPIが弾く */}
      <Alert className="border-warning/50 bg-warning/15">
        <AlertTriangle className="text-warning size-4" />
        <AlertDescription className="text-muted-foreground text-xs">
          実施中のキャンペーンを変更すると、適用中の会員にも影響します。
        </AlertDescription>
      </Alert>

      <CampaignFormBasicInfo />
      <CampaignFormPublishScope />
      <CampaignFormPeriodSettings />
      <CampaignFormMainContract />
      <CampaignFormDiscountSettings />
      <CampaignFormReferralSettings />
      <CampaignFormAutoGrantSettings />
      <CampaignFormStatus />

      <div className="flex items-center justify-end gap-2 border-t p-4">
        {hasErrors && form.formState.isSubmitted && (
          <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
        )}
        <Button
          type="button"
          size="lg"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          キャンセル
        </Button>
        {/* G-03 L236: キャンペーン登録は System / Headquarter のみ */}
        <RoleGatedButton
          type="submit"
          size="lg"
          requiredPermission={isEdit ? Permission.CampaignsEdit : Permission.CampaignsCreate}
          disabled={isSubmitting}
        >
          {isSubmitting ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </RoleGatedButton>
      </div>
    </div>
  );
}
