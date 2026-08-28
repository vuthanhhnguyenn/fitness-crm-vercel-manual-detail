'use client';

import { Suspense, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  deleteCrmCampaignsByIdMutation,
  getCrmCampaignsByIdOptions,
  getCrmCampaignsQueryKey,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import {
  CAMPAIGN_ACCEPT_STATE_BADGE_CLASSES,
  CAMPAIGN_ACCEPT_STATE_LABELS,
} from '../_constants/constants';
import { getCampaignErrorMessage } from '../_utils/campaign-error';
import { BasicInfoTab } from './_components/basic-info-tab';
import { CampaignDetailSkeleton } from './_components/campaign-detail-skeleton';
import { HistoryTab } from './_components/history-tab';
import { PromoCodeSection } from './_components/promo-code-section';

const TAB_VALUES = ['basic', 'promo', 'history'] as const;

function CampaignDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const campaignId = params.id as string;
  const tabParam = searchParams.get('tab');
  const defaultTab = TAB_VALUES.includes(tabParam as (typeof TAB_VALUES)[number])
    ? (tabParam as (typeof TAB_VALUES)[number])
    : 'basic';

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmCampaignsByIdOptions({ path: { id: campaignId } }),
  });

  const deleteMutation = useMutation({
    ...deleteCrmCampaignsByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'キャンペーンを削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmCampaignsQueryKey() });
      router.push(navigate('/campaigns'));
    },
    onError: (error) => {
      toast.error(getCampaignErrorMessage(error, '適用中の会員または申請があるため削除できません'));
      setDeleteOpen(false);
    },
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

  const campaign = data.campaign;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="キャンペーン管理に戻る" href={navigate('/campaigns')} />}
        title={campaign.name}
        badge={
          <Badge
            variant="outline"
            className={cn(
              'gap-1 text-xs font-medium',
              CAMPAIGN_ACCEPT_STATE_BADGE_CLASSES[campaign.acceptState],
            )}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {CAMPAIGN_ACCEPT_STATE_LABELS[campaign.acceptState]}
          </Badge>
        }
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
            <DropdownMenu>
              <DropdownMenuTrigger
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-md border"
                aria-label="campaign actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGatedMenuItem
                  requiredPermission={Permission.CampaignsEdit}
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs defaultValue={defaultTab} className="flex min-h-0 flex-1 flex-col gap-4">
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
          <PromoCodeSection campaign={campaign} />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 pt-0 pb-4">
          <HistoryTab campaignId={campaignId} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このキャンペーンを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{campaign.name}
              」を削除します。適用中の会員または申請があるキャンペーンは削除できません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate({ path: { id: campaignId } })}
              disabled={deleteMutation.isPending}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <Suspense fallback={<CampaignDetailSkeleton />}>
      <CampaignDetailPageContent />
    </Suspense>
  );
}
