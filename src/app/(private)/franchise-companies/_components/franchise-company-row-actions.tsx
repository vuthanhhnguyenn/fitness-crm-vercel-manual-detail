'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  // FR-030: 管轄店舗が1件以上ある場合のみ削除不可（理由を明示し、アクション自体は隠さない）
  const isDeleteBlocked = company.managed_store_count > 0;

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
        <DropdownMenuSeparator />
        {isDeleteBlocked ? (
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
              管轄店舗が存在するため
            </span>
          </DropdownMenuItem>
        ) : (
          <RoleGatedMenuItem
            requiredPermission={Permission.FCCompaniesDelete}
            className="text-destructive"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
              onDeleteClick?.(company);
            }}
          >
            <Trash2 className="size-4" />
            削除
          </RoleGatedMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
