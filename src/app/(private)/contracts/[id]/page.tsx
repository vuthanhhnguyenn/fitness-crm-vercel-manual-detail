'use client';

import { useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
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

import { getCrmMainContractsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmMainContractsByIdResponse } from '@/lib/api/types.gen';
import { MainContractStatus, MainContractType } from '@/lib/api/types.gen';

import { Permission } from '@/types/permission.type';

import {
  MAIN_CONTRACT_STATUS_BADGE_CLASSES,
  MAIN_CONTRACT_STATUS_LABELS,
  MAIN_CONTRACT_TYPE_BADGE_CLASSES,
  MAIN_CONTRACT_TYPE_LABELS,
} from '../_constants/constants';
import { getContractDeleteState, getContractEditState } from '../_utils/contract-action-state';
import { BasicInfoTab } from './_components/basic-info-tab';
import { ContractDeleteDialog } from './_components/contract-delete-dialog';
import { ContractDetailSkeleton } from './_components/contract-detail-skeleton';
import { HistoryTab } from './_components/history-tab';
import { PricingTab } from './_components/pricing-tab';

type ContractDetail = NonNullable<GetCrmMainContractsByIdResponse>['main_contract'];

export default function ContractDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const contractId = params.id as string;
  const activeTab = searchParams.get('tab') ?? 'basic';
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmMainContractsByIdOptions({ path: { id: contractId } }),
  });

  if (isLoading) return <ContractDetailSkeleton />;

  if (isError || !data?.main_contract) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.main_contract}
        onRetry={() => refetch()}
      />
    );
  }

  const contract: ContractDetail = data.main_contract;

  const handleTabChange = (tab: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const { canEdit, editBlockedMessage } = getContractEditState(contract);
  const { canDelete, deleteBlockedMessage } = getContractDeleteState(contract);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={
          <BreadcrumbNav
            items={[{ url: '/contracts', label: '主契約管理' }, { label: '契約詳細' }]}
          />
        }
        title={contract.name}
        badge={
          <>
            <Badge
              variant="outline"
              className={`gap-1 text-xs font-medium ${MAIN_CONTRACT_STATUS_BADGE_CLASSES[contract.status as MainContractStatus] ?? ''}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {MAIN_CONTRACT_STATUS_LABELS[contract.status as MainContractStatus] ??
                contract.status}
            </Badge>
            <Badge
              variant="outline"
              className={`text-xs ${MAIN_CONTRACT_TYPE_BADGE_CLASSES[contract.contract_type as MainContractType] ?? 'bg-muted text-muted-foreground border-border'}`}
            >
              {MAIN_CONTRACT_TYPE_LABELS[contract.contract_type as MainContractType] ??
                contract.contract_type}
            </Badge>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.ContractsEdit}
              className="gap-1"
              disabled={!canEdit}
              onClick={() => router.push(`/contracts/${contractId}/edit`)}
              tooltip={editBlockedMessage}
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
                  requiredPermission={Permission.ContractsDelete}
                  className="text-destructive"
                  disabled={!canDelete}
                  tooltip={deleteBlockedMessage}
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="size-4" />
                  削除
                </RoleGatedMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <ContractDeleteDialog
              contractId={contractId}
              contractName={contract.name}
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
            />
          </div>
        }
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="pricing">料金・条件</TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="basic" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <BasicInfoTab contract={contract} />
        </TabsContent>

        <TabsContent value="pricing" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <PricingTab contract={contract} />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <HistoryTab contractId={contractId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
