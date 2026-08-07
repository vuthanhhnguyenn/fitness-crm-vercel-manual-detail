'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { FranchiseCompanyListItem } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

interface FranchiseCompanyRowActionsProps {
  company: FranchiseCompanyListItem;
  onDeleteClick?: (company: FranchiseCompanyListItem) => void;
}

export function FranchiseCompanyRowActions({
  company,
  onDeleteClick,
}: FranchiseCompanyRowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const deleteBlockedReason =
    company.status === 'active'
      ? '有効なFC企業は削除できません'
      : company.managed_store_count > 0
        ? '管轄店舗があるため削除できません'
        : null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="sm" />}
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <RoleGatedMenuItem
          requiredPermission={Permission.FCCompaniesEdit}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
            router.push(navigate('/franchise-companies/[id]/edit', company.id));
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
        <RoleGatedMenuItem
          requiredPermission={Permission.FCCompaniesDelete}
          className="text-destructive"
          disabled={deleteBlockedReason !== null}
          tooltip={deleteBlockedReason ?? undefined}
          onClick={(event) => {
            event.stopPropagation();
            setOpen(false);
            onDeleteClick?.(company);
          }}
        >
          <Trash2 className="size-4" />
          削除
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
