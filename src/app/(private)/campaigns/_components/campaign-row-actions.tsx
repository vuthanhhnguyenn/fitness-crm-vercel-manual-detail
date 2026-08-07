'use client';

import { useRouter } from 'next/navigation';

import { MoreHorizontal, Pencil } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

type CampaignRowActionsProps = {
  campaignId: string;
  className?: string;
};

export function CampaignRowActions({ campaignId, className }: Readonly<CampaignRowActionsProps>) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(navigate('/campaigns/[id]/edit', campaignId));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={className ?? 'hover:bg-muted flex size-8 items-center justify-center rounded-md'}
        aria-label="campaign row actions"
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
        <RoleGatedMenuItem
          requiredPermission={Permission.CampaignsEdit}
          onClick={(event) => {
            event.stopPropagation();
            handleEdit();
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
