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

import { getCrmEquipmentByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmEquipmentByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { EQUIPMENT_STATUS_BADGE_MAP, EQUIPMENT_STATUS_LABELS } from '../_constants/constants';
import { EquipmentBasicInfoTab } from './_components/equipment-basic-info-tab';
import { EquipmentDeleteDialog } from './_components/equipment-delete-dialog';
import { EquipmentDetailSkeleton } from './_components/equipment-detail-skeleton';
import { EquipmentHistoryTab } from './_components/equipment-history-tab';

type EquipmentDetail = NonNullable<GetCrmEquipmentByIdResponse>['equipment'];

export default function EquipmentDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const equipmentId = params.id as string;
  const activeTab = searchParams.get('tab') ?? 'basic';
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmEquipmentByIdOptions({ path: { id: equipmentId } }),
    enabled: Boolean(equipmentId),
  });

  const equipment: EquipmentDetail | undefined = data?.equipment;
  const statusBadge = equipment ? EQUIPMENT_STATUS_BADGE_MAP[equipment.status] : null;

  const handleTabChange = (tab: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="接続機器" href={navigate('/equipment')} />}
        title={equipment?.name ?? '接続機器詳細'}
        subtitle={
          equipment
            ? `${equipment.store_name} — 接続機器ID: ${equipment.id}`
            : `接続機器ID: ${equipmentId}`
        }
        badge={
          equipment && statusBadge ? (
            <Badge variant="outline" className={statusBadge.badgeClassName}>
              <span className={`size-1.5 rounded-full ${statusBadge.dotClassName}`} />
              {EQUIPMENT_STATUS_LABELS[equipment.status]}
            </Badge>
          ) : undefined
        }
        actions={
          equipment ? (
            <div className="flex items-center gap-2">
              <RoleGatedButton
                requiredPermission={Permission.EquipmentDelete}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive gap-1"
                denyTooltip="削除権限がありません"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                削除
              </RoleGatedButton>
              <RoleGatedButton
                requiredPermission={Permission.EquipmentEdit}
                variant="outline"
                size="sm"
                className="gap-1"
                denyTooltip="編集権限がありません"
                onClick={() => router.push(navigate('/equipment/[id]/edit', equipment.id))}
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
          isEmpty={!equipment}
          onRetry={() => refetch()}
          skeleton={<EquipmentDetailSkeleton />}
          errorTitle="接続機器の取得に失敗しました。"
        >
          {equipment ? (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
              <TabsList variant="line">
                <TabsTrigger value="basic">基本情報</TabsTrigger>
                <TabsTrigger value="history">変更履歴</TabsTrigger>
              </TabsList>
              <TabsContent value="basic">
                <EquipmentBasicInfoTab equipment={equipment} />
              </TabsContent>
              <TabsContent value="history">
                <EquipmentHistoryTab equipmentId={equipment.id} />
              </TabsContent>
            </Tabs>
          ) : null}
        </DataStateBoundary>
      </div>

      {equipment ? (
        <EquipmentDeleteDialog
          equipmentId={equipment.id}
          equipmentName={equipment.name}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      ) : null}
    </div>
  );
}
