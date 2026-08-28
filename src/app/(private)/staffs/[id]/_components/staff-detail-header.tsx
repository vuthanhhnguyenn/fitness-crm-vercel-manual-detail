'use client';

import { useAuthUser } from '@/contexts/auth-user.context';
import { Pencil } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';

import { UserRole } from '@/types/permission.type';

import { StaffDeleteAction } from '../../_components/staff-delete-action';
import { STAFF_STATUS_CLASSES, STAFF_STATUS_LABELS, StaffStatus } from '../../_constants/constants';
import { StaffMagicLinkAction } from './staff-magic-link-action';

interface StaffDetailHeaderProps {
  staffId: string;
  fullName: string;
  staffStatus: StaffStatus;
  staffRole: string;
  /** Present only when linkage.type === 'direct_store' */
  linkedStoreId?: string;
  onEdit: () => void;
  onBack: () => void;
}

/**
 * Detail page header — breadcrumb, title, status badge, and role-gated actions
 * (magic-link / delete / edit) — src: staff-detail.tsx L149-191
 */
export function StaffDetailHeader({
  staffId,
  fullName,
  staffStatus,
  staffRole,
  linkedStoreId,
  onEdit,
  onBack,
}: StaffDetailHeaderProps) {
  const { user } = useAuthUser();
  const isSelf = Boolean(user?.staffId) && user?.staffId === staffId;

  const magicLinkAllowedRoles = isSelf
    ? ([
        UserRole.System,
        UserRole.Headquarter,
        UserRole.Manager,
        UserRole.Staff,
        UserRole.Trainer,
        UserRole.Observer,
      ] as const)
    : ([UserRole.Headquarter, UserRole.System] as const);

  const isManagerEditAllowed =
    user?.role === UserRole.Manager &&
    staffRole === 'staff' &&
    !!linkedStoreId &&
    (user.managedStoreIds ?? []).includes(linkedStoreId);
  const editAllowedRoles = isManagerEditAllowed
    ? ([UserRole.Headquarter, UserRole.System, UserRole.Manager] as const)
    : ([UserRole.Headquarter, UserRole.System] as const);
  const editDenyTooltip = isManagerEditAllowed
    ? '管理者権限が必要です'
    : '担当店舗のスタッフのみ編集できます';

  return (
    <PageHeader
      breadcrumb={<BackLink label="スタッフ管理に戻る" onClick={onBack} />}
      title={fullName}
      badge={
        <Badge
          variant="outline"
          className={`gap-1 text-xs font-medium ${STAFF_STATUS_CLASSES[staffStatus]}`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {STAFF_STATUS_LABELS[staffStatus]}
        </Badge>
      }
      actions={
        <>
          <StaffMagicLinkAction
            staffId={staffId}
            staffName={fullName}
            allowedRoles={magicLinkAllowedRoles}
          />
          <StaffDeleteAction staffId={staffId} />
          <RoleGatedButton
            variant="outline"
            allowedRoles={editAllowedRoles}
            denyTooltip={editDenyTooltip}
            className="gap-1"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            編集
          </RoleGatedButton>
        </>
      }
    />
  );
}
