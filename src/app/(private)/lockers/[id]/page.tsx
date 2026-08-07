'use client';

import { useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useAuthUser } from '@/contexts/auth-user.context';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmLockersByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { LOCKER_SHAPE_LABELS } from '../_constants/constants';
import { LockerDeleteDialog } from './_components/locker-delete-dialog';
import { LockerDetailSkeleton } from './_components/locker-detail-skeleton';
import { LockerHistoryTab } from './_components/locker-history-tab';
import { LockerInfoTab } from './_components/locker-info-tab';
import { SlotManagementTab } from './_components/slot-management-tab';

type LockerDetail = NonNullable<GetCrmLockersByIdResponse>['locker'];

export default function LockerDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuthUser();
  const canManageSlots = hasPermission(Permission.LockersEdit);

  const lockerId = params.id as string;
  const requestedTab = searchParams.get('tab') ?? 'info';
  const activeTab = requestedTab === 'slots' && !canManageSlots ? 'info' : requestedTab;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLockersByIdOptions({ path: { id: lockerId } }),
    enabled: Boolean(lockerId),
  });

  if (isLoading) return <LockerDetailSkeleton />;

  if (isError || !data?.locker) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.locker}
        onRetry={() => refetch()}
      />
    );
  }

  const locker: LockerDetail = data.locker;

  const handleTabChange = (tab: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const hasActiveSlots = locker.has_active_slots;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={
          <BreadcrumbNav
            items={[{ url: '/lockers', label: 'ロッカー管理' }, { label: 'ロッカー詳細' }]}
          />
        }
        title={`${locker.area} — ${LOCKER_SHAPE_LABELS[locker.shape]}`}
        subtitle={`${locker.store_name} — ロッカーID: ${locker.locker_id}`}
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.LockersDelete}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive gap-1"
              disabled={hasActiveSlots}
              denyTooltip="ロッカー削除の権限がありません"
              tooltip={
                hasActiveSlots
                  ? '使用中・開放待ちのスロットが存在するため削除できません'
                  : undefined
              }
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              削除
            </RoleGatedButton>
            <RoleGatedButton
              requiredPermission={Permission.LockersEdit}
              variant="outline"
              size="sm"
              className="gap-1"
              denyTooltip="編集権限がありません"
              onClick={() => router.push(navigate('/lockers/[id]/edit', lockerId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="info">ロッカー情報</TabsTrigger>
            {canManageSlots ? <TabsTrigger value="slots">スロット管理</TabsTrigger> : null}
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <LockerInfoTab locker={locker} />
        </TabsContent>

        {canManageSlots ? (
          <TabsContent value="slots" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <SlotManagementTab locker={locker} />
          </TabsContent>
        ) : null}

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <LockerHistoryTab lockerId={lockerId} />
        </TabsContent>
      </Tabs>

      <LockerDeleteDialog
        lockerId={lockerId}
        lockerName={locker.locker_id}
        hasActiveSlots={hasActiveSlots}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
