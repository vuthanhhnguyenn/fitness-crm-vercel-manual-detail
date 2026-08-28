'use client';

import { useRouter } from 'next/navigation';

import { ListOrdered, Plus } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

interface BannerListHeaderActionsProps {
  onOrderClick?: () => void;
}

export function BannerListHeaderActions({ onOrderClick }: BannerListHeaderActionsProps) {
  const router = useRouter();
  const denyToolTipMessage = '本部権限が必要です';

  return (
    <div className="flex items-center gap-2">
      <RoleGatedButton
        requiredPermission={Permission.BannersReorder}
        type="button"
        variant="outline"
        className="gap-1"
        denyTooltip={denyToolTipMessage}
        onClick={onOrderClick}
      >
        <ListOrdered className="size-4" />
        並び順を編集
      </RoleGatedButton>

      <RoleGatedButton
        requiredPermission={Permission.BannersCreate}
        type="button"
        className="gap-1"
        denyTooltip={denyToolTipMessage}
        onClick={() => router.push(navigate('/banners/create'))}
      >
        <Plus className="size-4" />
        新規登録
      </RoleGatedButton>
    </div>
  );
}
