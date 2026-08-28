'use client';

import { Eye, EyeOff, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { GetCrmExercisesResponse } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import { getExercisePublishActionLabel } from '../_constants/constants';

type ExerciseRow = NonNullable<GetCrmExercisesResponse>['items'][number];

interface ExerciseRowActionsProps {
  row: ExerciseRow;
  onEdit: (id: string) => void;
  onTogglePublish: (row: ExerciseRow) => void;
  onDelete: (row: ExerciseRow) => void;
}

export function ExerciseRowActions({
  row,
  onEdit,
  onTogglePublish,
  onDelete,
}: ExerciseRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-muted flex size-8 items-center justify-center rounded-md"
        aria-label="exercise row actions"
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <RoleGatedMenuItem
          requiredPermission={Permission.ExercisesEdit}
          onClick={(event) => {
            event.stopPropagation();
            onEdit(row.id);
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>

        <RoleGatedMenuItem
          requiredPermission={Permission.ExercisesPublish}
          onClick={(event) => {
            event.stopPropagation();
            onTogglePublish(row);
          }}
        >
          {row.publishStatus === 'private' ? (
            <>
              <Eye className="size-4" />
              {getExercisePublishActionLabel(row.publishStatus)}
            </>
          ) : (
            <>
              <EyeOff className="size-4" />
              {getExercisePublishActionLabel(row.publishStatus)}
            </>
          )}
        </RoleGatedMenuItem>

        <DropdownMenuSeparator />

        <RoleGatedMenuItem
          requiredPermission={Permission.ExercisesDelete}
          className="text-destructive focus:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(row);
          }}
        >
          <Trash2 className="size-4" />
          削除
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
