'use client';

import { useRouter } from 'next/navigation';

import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

type CampaignRowActionsProps = {
  campaignId: string;
  onDeleteClick: () => void;
  className?: string;
};

export function CampaignRowActions({
  campaignId,
  onDeleteClick,
  className,
}: Readonly<CampaignRowActionsProps>) {
  const router = useRouter();

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
            router.push(navigate('/campaigns/[id]/edit', campaignId));
          }}
        >
          <Pencil className="size-4" />
          編集
        </RoleGatedMenuItem>
        {/* G-03 FR-S003: 全設定をコピーした状態で新規登録画面を開く */}
        <RoleGatedMenuItem
          requiredPermission={Permission.CampaignsCreate}
          onClick={(event) => {
            event.stopPropagation();
            router.push(`${navigate('/campaigns/create')}?copyFrom=${campaignId}`);
          }}
        >
          <Copy className="size-4" />
          複製
        </RoleGatedMenuItem>
        <DropdownMenuSeparator />
        <RoleGatedMenuItem
          requiredPermission={Permission.CampaignsEdit}
          className="text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onDeleteClick();
          }}
        >
          <Trash2 className="size-4" />
          削除
        </RoleGatedMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
