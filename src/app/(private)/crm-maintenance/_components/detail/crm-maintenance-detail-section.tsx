'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CrmMaintenanceDeleteDialog } from '@/app/(private)/crm-maintenance/_components/crm-maintenance-delete-dialog';
import { CrmMaintenanceDetailInfoCards } from '@/app/(private)/crm-maintenance/_components/detail/crm-maintenance-detail-info-cards';
import { CrmMaintenanceDetailNotificationCard } from '@/app/(private)/crm-maintenance/_components/detail/crm-maintenance-detail-notification-card';
import { CrmMaintenanceDetailSkeleton } from '@/app/(private)/crm-maintenance/_components/detail/crm-maintenance-detail-skeleton';
import { CrmMaintenanceDetailStatusCard } from '@/app/(private)/crm-maintenance/_components/detail/crm-maintenance-detail-status-card';
import { CrmMaintenanceNotifyDialog } from '@/app/(private)/crm-maintenance/_components/detail/crm-maintenance-notify-dialog';
import {
  CRM_MAINTENANCE_STATUS_BADGE_CLASSES,
  CRM_MAINTENANCE_STATUS_LABELS,
} from '@/app/(private)/crm-maintenance/_constants/crm-maintenance.constants';
import { useAuthUser } from '@/contexts/auth-user.context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  deleteCrmMaintenancesByIdMutation,
  getCrmMaintenancesByIdOptions,
  getCrmMaintenancesByIdQueryKey,
  getCrmMaintenancesQueryKey,
  postCrmMaintenancesByIdNotificationsMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { CrmMaintenanceStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

interface CrmMaintenanceDetailSectionProps {
  maintenanceId: string;
}

export function CrmMaintenanceDetailSection({ maintenanceId }: CrmMaintenanceDetailSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthUser();
  const hasDeletePermission = hasPermission(Permission.CrmMaintenanceDelete);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  // `notifyMutation.isPending` only updates on the next render, so a rapid double-click
  // (both firing before React re-renders and disables the confirm button) can call
  // `mutate()` twice. This ref is set/read synchronously in the same tick to close that gap.
  const isSendingNotificationRef = useRef(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMaintenancesByIdOptions({ path: { id: maintenanceId } }),
    enabled: Boolean(maintenanceId),
  });

  const deleteMutation = useMutation({
    ...deleteCrmMaintenancesByIdMutation(),
    onSuccess: (response) => {
      toast.success(response.message || 'CRMメンテナンス情報を削除しました');
      queryClient.invalidateQueries({ queryKey: getCrmMaintenancesQueryKey() });
      setDeleteOpen(false);
      router.push(navigate('/crm-maintenance'));
    },
    onError: (error) => {
      toast.error(
        (error as { error?: string })?.error || 'CRMメンテナンス情報の削除に失敗しました',
      );
    },
  });

  const notifyMutation = useMutation({
    ...postCrmMaintenancesByIdNotificationsMutation(),
    onSuccess: () => {
      toast.success('通知を送信しました');
      queryClient.invalidateQueries({
        queryKey: getCrmMaintenancesByIdQueryKey({ path: { id: maintenanceId } }),
      });
      queryClient.invalidateQueries({ queryKey: getCrmMaintenancesQueryKey() });
      setNotifyOpen(false);
    },
    onError: (error) => {
      toast.error(
        (error as { error?: string })?.error || 'CRMメンテナンス通知の送信に失敗しました',
      );
    },
    onSettled: () => {
      isSendingNotificationRef.current = false;
    },
  });

  const handleSendNotification = () => {
    if (isSendingNotificationRef.current) return;
    isSendingNotificationRef.current = true;
    notifyMutation.mutate({ path: { id: maintenanceId } });
  };

  if (!data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <PageHeader
          breadcrumb={
            <BackLink label="CRMメンテナンス管理に戻る" href={navigate('/crm-maintenance')} />
          }
          title="CRMメンテナンス詳細"
        />
        <DataStateBoundary
          isLoading={isLoading}
          isError={isError}
          isEmpty={!isLoading && !isError}
          onRetry={() => void refetch()}
          emptyTitle="メンテナンス情報が見つかりません"
          emptyDescription={`指定されたID（${maintenanceId}）のメンテナンス情報は存在しません。`}
          skeleton={<CrmMaintenanceDetailSkeleton />}
        />
      </div>
    );
  }

  const canDelete = data.status !== CrmMaintenanceStatus.IN_PROGRESS;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        breadcrumb={
          <BackLink label="CRMメンテナンス管理に戻る" href={navigate('/crm-maintenance')} />
        }
        title={data.title}
        badge={
          <Badge
            variant="outline"
            className={cn('text-xs font-medium', CRM_MAINTENANCE_STATUS_BADGE_CLASSES[data.status])}
          >
            {CRM_MAINTENANCE_STATUS_LABELS[data.status]}
          </Badge>
        }
        actions={
          <>
            <RoleGatedButton
              requiredPermission={Permission.CrmMaintenanceEdit}
              denyTooltip="CRMメンテナンス編集は System 権限のみ可能です"
              className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
              onClick={() => router.push(navigate('/crm-maintenance/[id]/edit', maintenanceId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>

            {hasDeletePermission && (
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canDelete ? (
                    <RoleGatedMenuItem
                      requiredPermission={Permission.CrmMaintenanceDelete}
                      denyBadge="System"
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      削除
                    </RoleGatedMenuItem>
                  ) : (
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground"
                      onSelect={(event) => event.preventDefault()}
                    >
                      <Trash2 className="mr-2 size-4" />
                      削除（メンテナンス中）
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </>
        }
      />

      <main className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="flex gap-4">
          <CrmMaintenanceDetailInfoCards maintenance={data} />
          <div className="w-[40%]">
            <div className="sticky top-0 flex flex-col gap-4">
              <CrmMaintenanceDetailStatusCard
                status={data.status}
                createdAt={data.createdAt}
                createdBy={data.createdBy}
                updatedAt={data.updatedAt}
              />
              <CrmMaintenanceDetailNotificationCard
                notified={data.notified ?? false}
                onSend={() => setNotifyOpen(true)}
              />
            </div>
          </div>
        </div>
      </main>

      <CrmMaintenanceDeleteDialog
        target={deleteOpen ? { id: data.id, title: data.title } : null}
        onOpenChange={(open) => setDeleteOpen(open)}
        onConfirm={() => deleteMutation.mutate({ path: { id: data.id } })}
        isPending={deleteMutation.isPending}
      />

      <CrmMaintenanceNotifyDialog
        open={notifyOpen}
        onOpenChange={setNotifyOpen}
        maintenance={data}
        onConfirm={handleSendNotification}
        isPending={notifyMutation.isPending}
      />
    </div>
  );
}
