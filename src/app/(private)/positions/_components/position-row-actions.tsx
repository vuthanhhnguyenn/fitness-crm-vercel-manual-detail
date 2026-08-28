'use client';

// Client component: dropdown menu interaction + role-gated actions
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { PositionListItem } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type PositionRowActionsProps = {
  position: PositionListItem;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
};

export function PositionRowActions({
  position,
  onEdit,
  onClone,
  onDelete,
}: PositionRowActionsProps) {
  const hasAssignedStaff = position.staff_count > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-muted flex size-8 items-center justify-center rounded-md">
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <RoleGatedMenuItem requiredPermission={Permission.PositionsEdit} onClick={onEdit}>
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
        <RoleGatedMenuItem requiredPermission={Permission.PositionsCreate} onClick={onClone}>
          <Copy className="size-4" />
          複製
        </RoleGatedMenuItem>
        <DropdownMenuSeparator />
        {hasAssignedStaff ? (
          // 割当スタッフが1名以上いる職位は削除不可 (FR-014 / PAR027)
          <DropdownMenuItem
            className="text-muted-foreground"
            disabled
            onSelect={(event) => event.preventDefault()}
          >
            <Trash2 className="size-4" />
            削除（割当あり）
          </DropdownMenuItem>
        ) : (
          <RoleGatedMenuItem
            requiredPermission={Permission.PositionsDelete}
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            削除
          </RoleGatedMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
