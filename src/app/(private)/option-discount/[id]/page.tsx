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

import { getCrmOptionDiscountsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmOptionDiscountsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  OPTION_DISCOUNT_STATUS_BADGE_CLASSES,
  OPTION_DISCOUNT_STATUS_LABELS,
} from '../_constants/constants';
import { BasicInfoTab } from './_components/basic-info-tab';
import { HistoryTab } from './_components/history-tab';
import { OptionDiscountDeleteDialog } from './_components/option-discount-delete-dialog';

type OptionDiscountDetail = NonNullable<GetCrmOptionDiscountsByIdResponse>['option_discount'];

export default function OptionDiscountDetailPage() {
  const params = useParams();
  const router = useRouter();

  const optionDiscountId = params.id as string;
  const [activeTab, setActiveTab] = useState('basic');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmOptionDiscountsByIdOptions({ path: { id: optionDiscountId } }),
  });

  if (isLoading) {
    return <DataStateBoundary isLoading isEmpty={false} />;
  }

  if (isError || !data?.option_discount) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.option_discount}
        onRetry={() => refetch()}
        emptyTitle="セット割が見つかりません"
      />
    );
  }

  const detail: OptionDiscountDetail = data.option_discount;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="セット割設定に戻る" href={navigate('/option-discount')} />}
        title={detail.name}
        badge={
          <>
            <Badge
              variant="outline"
              className={`gap-1 text-xs font-medium ${OPTION_DISCOUNT_STATUS_BADGE_CLASSES[detail.status]}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {OPTION_DISCOUNT_STATUS_LABELS[detail.status]}
            </Badge>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.OptionDiscountsEdit}
              className="gap-1"
              onClick={() => router.push(navigate('/option-discount/[id]/edit', optionDiscountId))}
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
                  requiredPermission={Permission.OptionDiscountsDelete}
                  className="text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <OptionDiscountDeleteDialog
              optionDiscountId={optionDiscountId}
              optionDiscountName={detail.name}
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
          <BasicInfoTab data={detail} />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <HistoryTab optionDiscountId={optionDiscountId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
