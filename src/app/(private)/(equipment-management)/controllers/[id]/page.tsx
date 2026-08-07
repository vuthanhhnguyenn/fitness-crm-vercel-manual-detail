'use client';

import { useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmControllersByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmControllersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { CONTROLLER_STATUS_BADGE_MAP, CONTROLLER_STATUS_LABELS } from '../_constants/constants';
import { ControllerBasicInfoTab } from './_components/controller-basic-info-tab';
import { ControllerDeleteDialog } from './_components/controller-delete-dialog';
import { ControllerDetailSkeleton } from './_components/controller-detail-skeleton';
import { ControllerDevicesTab } from './_components/controller-devices-tab';
import { ControllerHistoryTab } from './_components/controller-history-tab';

type ControllerDetail = NonNullable<GetCrmControllersByIdResponse>;

export default function ControllerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const controllerId = params.id as string;
  const activeTab = searchParams.get('tab') ?? 'basic';
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmControllersByIdOptions({ path: { id: controllerId } }),
    enabled: Boolean(controllerId),
  });

  const controller: ControllerDetail | undefined = data;
  const statusBadge = controller ? CONTROLLER_STATUS_BADGE_MAP[controller.status] : null;
  const hasConnectedDevices = (controller?.device_count ?? 0) > 0;

  const handleTabChange = (tab: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="接点制御装置" href={navigate('/controllers')} />}
        title={controller?.name ?? '接点制御装置詳細'}
        subtitle={
          controller
            ? `${controller.store_code} — 接点制御装置ID: ${controller.controller_id}`
            : `接点制御装置ID: ${controllerId}`
        }
        badge={
          controller && statusBadge ? (
            <Badge variant="outline" className={statusBadge.badgeClassName}>
              <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
              {CONTROLLER_STATUS_LABELS[controller.status]}
            </Badge>
          ) : undefined
        }
        actions={
          controller ? (
            <div className="flex items-center gap-2">
              <RoleGatedButton
                requiredPermission={Permission.ControllerDelete}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive gap-1"
                denyTooltip="削除権限がありません"
                tooltip={hasConnectedDevices ? '紐付き機器が存在するため削除できません' : undefined}
                disabled={hasConnectedDevices}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                削除
              </RoleGatedButton>
              <RoleGatedButton
                requiredPermission={Permission.ControllerEdit}
                variant="outline"
                size="sm"
                className="gap-1"
                denyTooltip="編集権限がありません"
                onClick={() =>
                  router.push(navigate('/controllers/[id]/edit', controller.controller_id))
                }
              >
                <Pencil className="size-4" />
                編集
              </RoleGatedButton>
            </div>
          ) : undefined
        }
      />

      <div className="bg-background min-h-0 flex-1 overflow-y-auto px-6 py-4">
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!controller}
          onRetry={() => refetch()}
          skeleton={<ControllerDetailSkeleton />}
          errorTitle="接点制御装置の取得に失敗しました。"
        >
          {controller ? (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
              <TabsList variant="line">
                <TabsTrigger value="basic">基本情報</TabsTrigger>
                <TabsTrigger value="devices">
                  紐付き機器一覧
                  <Badge
                    variant="outline"
                    className="bg-muted-foreground/15 text-muted-foreground ml-1 min-w-5 border-transparent px-1 font-medium tabular-nums"
                  >
                    {controller.device_count}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="history">変更履歴</TabsTrigger>
              </TabsList>
              <TabsContent value="basic">
                <ControllerBasicInfoTab
                  controller={controller}
                  onViewDevices={() => handleTabChange('devices')}
                />
              </TabsContent>
              <TabsContent value="devices">
                <ControllerDevicesTab controllerId={controller.controller_id} />
              </TabsContent>
              <TabsContent value="history">
                <ControllerHistoryTab controllerId={controller.controller_id} />
              </TabsContent>
            </Tabs>
          ) : null}
        </DataStateBoundary>
      </div>

      {controller ? (
        <ControllerDeleteDialog
          controllerId={controller.controller_id}
          controllerName={controller.name ?? controller.controller_id}
          deviceCount={controller.device_count}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      ) : null}
    </div>
  );
}
