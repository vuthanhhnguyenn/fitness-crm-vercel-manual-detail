'use client';

import { Suspense, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { Loading } from '@/components/common/data-state-boundary/loading';
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

import { getCrmFranchiseCompaniesByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmFranchiseCompaniesByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import {
  FRANCHISE_COMPANY_STATUS_BADGE_CLASSES,
  FRANCHISE_COMPANY_STATUS_LABELS,
} from '../_constants/constants';
import { BasicInfoTab } from './_components/basic-info-tab';
import { FranchiseCompanyDeleteDialog } from './_components/franchise-company-delete-dialog';
import { HistoryTab } from './_components/history-tab';
import { LinkedStoresTab } from './_components/linked-stores-tab';

type FranchiseCompanyDetail = GetCrmFranchiseCompaniesByIdResponse['franchise_company'];

function FranchiseCompanyDetailPageContent() {
  const params = useParams();
  const router = useRouter();

  const companyId = params.id as string;
  const [activeTab, setActiveTab] = useState('basic');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmFranchiseCompaniesByIdOptions({ path: { id: companyId } }),
  });

  if (isLoading) {
    return <Loading />;
  }

  const response = data as GetCrmFranchiseCompaniesByIdResponse | undefined;
  const detail = response?.franchise_company as FranchiseCompanyDetail | undefined;
  const linkedStores = response?.linked_stores ?? [];
  const deleteBlockedReason = detail
    ? [
        detail.status === 'active' ? '有効なFC企業は削除できません' : null,
        detail.managed_store_count > 0 ? '管轄店舗があるため削除できません' : null,
      ]
        .filter(Boolean)
        .join(' / ') || null
    : null;

  if (isError || !response || !detail) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!detail}
        onRetry={() => refetch()}
        emptyTitle="FC企業が見つかりません"
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="FC企業管理に戻る" href={navigate('/franchise-companies')} />}
        title={detail.display_name}
        badge={
          <Badge
            variant="outline"
            className={`text-xs ${FRANCHISE_COMPANY_STATUS_BADGE_CLASSES[detail.status]}`}
          >
            {FRANCHISE_COMPANY_STATUS_LABELS[detail.status]}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.FCCompaniesEdit}
              className="gap-1"
              onClick={() => router.push(navigate('/franchise-companies/[id]/edit', companyId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>

            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger className="border-input hover:bg-accent flex size-8 items-center justify-center rounded-md border">
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <RoleGatedMenuItem
                  requiredPermission={Permission.FCCompaniesDelete}
                  className="text-destructive"
                  disabled={deleteBlockedReason !== null}
                  tooltip={deleteBlockedReason ?? undefined}
                  onClick={() => {
                    setMenuOpen(false);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="stores">管轄店舗</TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <BasicInfoTab franchiseCompany={detail} linkedStoreCount={linkedStores.length} />
        </TabsContent>

        <TabsContent value="stores" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <LinkedStoresTab linkedStores={linkedStores} />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <HistoryTab history={response.history} />
        </TabsContent>
      </Tabs>

      <FranchiseCompanyDeleteDialog
        companyId={companyId}
        companyName={detail.display_name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

export default function FranchiseCompanyDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <FranchiseCompanyDetailPageContent />
    </Suspense>
  );
}
