'use client';

import { useRouter } from 'next/navigation';

import { Pencil, Trash2 } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

interface AppVersionDetailHeaderActionsProps {
  id: string;
  onDeleteClick: () => void;
}

export function AppVersionDetailHeaderActions({
  id,
  onDeleteClick,
}: AppVersionDetailHeaderActionsProps) {
  const router = useRouter();

  return (
    <>
      <RoleGatedButton
        requiredPermission={Permission.AppVersionsDelete}
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive gap-1"
        denyTooltip="削除権限がありません"
        onClick={onDeleteClick}
      >
        <Trash2 className="size-4" />
        削除
      </RoleGatedButton>
      <RoleGatedButton
        requiredPermission={Permission.AppVersionsEdit}
        variant="outline"
        size="sm"
        className="gap-1"
        denyTooltip="編集権限がありません"
        onClick={() => router.push(navigate('/app-versions/[id]/edit', id))}
      >
        <Pencil className="size-4" />
        編集
      </RoleGatedButton>
    </>
  );
}
