'use client';

import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { RoleGatedMenuItem } from '@/components/common/role-gated-menu-item';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmOptionsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionsByIdResponse } from '@/lib/api/types.gen';
import { OptionStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { OPTION_STATUS_BADGE_CLASSES, OPTION_STATUS_LABELS } from '../_constants/constants';
import { BasicInfoTab } from './_components/basic-info-tab';
import { HistoryTab } from './_components/history-tab';
import { OptionDeleteDialog } from './_components/option-delete-dialog';

type OptionDetail = NonNullable<GetCrmOptionsByIdResponse>['option'];

export default function OptionDetailPage() {
  const params = useParams();
  const router = useRouter();

  const optionId = params.id as string;
  const [activeTab, setActiveTab] = useState('basic');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmOptionsByIdOptions({ path: { id: optionId } }),
  });

  if (isLoading) {
    return <DataStateBoundary isLoading isEmpty={false} />;
  }

  if (isError || !data?.option) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.option}
        onRetry={() => refetch()}
        emptyTitle="オプションが見つかりません"
      />
    );
  }

  const option: OptionDetail = data.option;
  const deleteBlockedReason =
    option.member_count > 0
      ? `利用会員が ${option.member_count.toLocaleString()} 名存在するため削除できません`
      : option.linked_contracts > 0
        ? `紐付け契約が ${option.linked_contracts} 件存在するため削除できません`
        : undefined;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="オプション管理に戻る" href={navigate('/options')} />}
        title={option.name}
        badge={
          <Badge
            variant="outline"
            className={`gap-1 text-xs font-medium ${OPTION_STATUS_BADGE_CLASSES[option.status as OptionStatus]}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {OPTION_STATUS_LABELS[option.status as OptionStatus]}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.OptionsEdit}
              className="gap-1"
              onClick={() => router.push(navigate('/options/[id]/edit', optionId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>

            <DropdownMenu>
              <DropdownMenuTrigger className="border-input hover:bg-accent flex size-8 items-center justify-center rounded-md border">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGatedMenuItem
                  requiredPermission={Permission.OptionsDelete}
                  className="text-destructive focus:text-destructive"
                  disabled={Boolean(deleteBlockedReason)}
                  tooltip={deleteBlockedReason}
                  onClick={() => {
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <OptionDeleteDialog
              optionId={optionId}
              optionName={option.name}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            />
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <BasicInfoTab option={option} />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <HistoryTab optionId={optionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
