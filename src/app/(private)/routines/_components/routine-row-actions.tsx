'use client';

import { Copy, Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { RoutineListItem } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

type RoutineRowActionsProps = {
  routine: RoutineListItem;
  onEdit: () => void;
  onDuplicate: () => void;
  onTogglePublish: () => void;
  onDelete: () => void;
};

export function RoutineRowActions({
  routine,
  onEdit,
  onDuplicate,
  onTogglePublish,
  onDelete,
}: RoutineRowActionsProps) {
  const isPublished = routine.publishStatus === 'published';
  const hasNoExercise = routine.exerciseCount === 0;

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger className="hover:bg-muted flex size-8 items-center justify-center rounded-md">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">操作メニュー</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <RoleGatedMenuItem requiredPermission={Permission.RoutinesEdit} onClick={onEdit}>
            <Pencil className="size-4" />
            編集
          </RoleGatedMenuItem>
          <RoleGatedMenuItem requiredPermission={Permission.RoutinesCreate} onClick={onDuplicate}>
            <Copy className="size-4" />
            複製
          </RoleGatedMenuItem>

          <DropdownMenuSeparator />

          {/* Y-09 FR-007: 状態に応じて公開/非公開の切替を出し分け。0件は公開不可 */}
          {isPublished ? (
            <RoleGatedMenuItem
              requiredPermission={Permission.RoutinesPublish}
              className="text-warning"
              onClick={onTogglePublish}
            >
              <EyeOff className="size-4" />
              非公開にする
            </RoleGatedMenuItem>
          ) : hasNoExercise ? (
            <DropdownMenuItem
              disabled
              className="text-muted-foreground flex-col items-start gap-0"
              onSelect={(event) => event.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <Eye className="size-4" />
                <span>公開できません</span>
              </div>
              <span className="text-muted-foreground/80 ml-6 text-[10px]">
                エクササイズが1件以上登録されている必要があります
              </span>
            </DropdownMenuItem>
          ) : (
            <RoleGatedMenuItem
              requiredPermission={Permission.RoutinesPublish}
              onClick={onTogglePublish}
            >
              <Eye className="size-4" />
              公開する
            </RoleGatedMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Y-09 FR-006: 公開中は削除不可。理由を併記 */}
          {isPublished ? (
            <DropdownMenuItem
              disabled
              className="text-muted-foreground flex-col items-start gap-0"
              onSelect={(event) => event.preventDefault()}
            >
              <div className="flex items-center gap-2">
                <Trash2 className="size-4" />
                <span>削除できません</span>
              </div>
              <span className="text-muted-foreground/80 ml-6 text-[10px]">
                先に「非公開にする」を実行してください
              </span>
            </DropdownMenuItem>
          ) : (
            <RoleGatedMenuItem
              requiredPermission={Permission.RoutinesDelete}
              className="text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
              削除
            </RoleGatedMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
