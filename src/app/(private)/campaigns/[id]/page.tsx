'use client';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Pencil } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmCampaignsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { CampaignDetail } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { BasicInfoTab } from './_components/basic-info-tab';
import { CampaignDetailSkeleton } from './_components/campaign-detail-skeleton';
import { HistoryTab } from './_components/history-tab';
import { PromoCodeSection } from './_components/promo-code-section';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();

  const campaignId = params.id as string;

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmCampaignsByIdOptions({
      path: { id: campaignId },
    }),
  });

  if (isLoading) {
    return <CampaignDetailSkeleton />;
  }

  if (isError || !data?.campaign) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.campaign}
        onRetry={() => refetch()}
        emptyTitle="キャンペーンが見つかりません"
      />
    );
  }

  const campaign = data.campaign as CampaignDetail;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="キャンペーン管理に戻る" href={navigate('/campaigns')} />}
        title={campaign.name}
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.CampaignsEdit}
              variant="default"
              className="gap-1"
              onClick={() => router.push(navigate('/campaigns/[id]/edit', campaignId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>
          </div>
        }
      />

      <Tabs defaultValue="basic" className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="promo">プロモーションコード</TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <BasicInfoTab campaign={campaign} />
        </TabsContent>

        <TabsContent value="promo" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <PromoCodeSection
            campaignId={campaign.id}
            campaignCode={campaign.code}
            campaignName={campaign.name}
            promoCodePreviews={campaign.promo_code_previews}
          />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <HistoryTab campaignId={campaignId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
