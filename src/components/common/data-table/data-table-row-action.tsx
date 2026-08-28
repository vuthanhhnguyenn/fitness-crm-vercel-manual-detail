'use client';

import type { MouseEvent } from 'react';
import { Fragment } from 'react';

import type { LucideIcon } from 'lucide-react';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { Permission } from '@/types/permission.type';

type RowActionKey = 'view' | 'edit' | 'delete';

type RowActionMeta = {
  label: string;
  icon: LucideIcon;
  destructive?: boolean;
  separatorBefore?: boolean;
};

type RowActionHandlers<TData> = {
  view?: (row: TData) => void;
  edit?: (row: TData) => void;
  delete?: (row: TData) => void;
};

type RowActionPermissions = Partial<Record<RowActionKey, Permission>>;

type RowActionLabels = Partial<Record<RowActionKey, string>>;

const ROW_ACTION_META: Record<RowActionKey, RowActionMeta> = {
  view: {
    label: '詳細',
    icon: Eye,
  },
  edit: {
    label: '編集',
    icon: Pencil,
  },
  delete: {
    label: '削除',
    icon: Trash2,
    destructive: true,
    separatorBefore: true,
  },
};

interface DataTableRowActionsProps<TData> {
  row: TData;
  actions?: RowActionKey[];
  handlers: RowActionHandlers<TData>;
  permissions?: RowActionPermissions;
  labels?: RowActionLabels;
}

export function DataTableRowActions<TData>({
  row,
  actions = ['view', 'edit', 'delete'],
  handlers,
  permissions,
  labels,
}: DataTableRowActionsProps<TData>) {
  const visibleActions = actions.filter((action) => handlers[action]);

  if (visibleActions.length === 0) {
    return null;
  }

  const handleClick = (action: RowActionKey, event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    handlers[action]?.(row);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" />}
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        {visibleActions.map((action, index) => {
          const meta = ROW_ACTION_META[action];
          const Icon = meta.icon;

          return (
            <Fragment key={action}>
              {meta.separatorBefore && index > 0 && <DropdownMenuSeparator />}

              <RoleGatedMenuItem
                requiredPermission={permissions?.[action]}
                className={meta.destructive ? 'text-destructive focus:text-destructive' : undefined}
                onClick={(event) => handleClick(action, event)}
              >
                <Icon className="size-4" />
                {labels?.[action] ?? meta.label}
              </RoleGatedMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
