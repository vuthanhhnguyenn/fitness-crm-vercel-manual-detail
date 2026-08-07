'use client';

import { useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Pencil, XCircle } from 'lucide-react';

import { BackLink } from '@/components/common/back-link';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getCrmLockersContractsByIdOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { GetCrmLockersContractsByIdResponse } from '@/lib/api/types.gen';
import { LockerContractStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { ContractInfoTab } from './_components/contract-info-tab';
import { HistoryTab } from './_components/history-tab';
import { LockerContractDetailSkeleton } from './_components/locker-contract-detail-skeleton';
import { LockerContractTerminateDialog } from './_components/locker-contract-terminate-dialog';
import { LOCKER_CONTRACT_STATUS_BADGE_MAP } from './_constants/locker-contract-status.constants';
import { isLockerContractTerminated } from './_utils/locker-contract-status.util';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

export default function LockerContractDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const contractId = params.id as string;
  const activeTab = searchParams.get('tab') ?? 'contract';
  const [terminateOpen, setTerminateOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    ...getCrmLockersContractsByIdOptions({ path: { id: contractId } }),
    enabled: Boolean(contractId),
  });

  if (isLoading) return <LockerContractDetailSkeleton />;

  if (isError || !data?.contract) {
    return (
      <DataStateBoundary
        isLoading={false}
        isError={isError}
        isEmpty={!data?.contract}
        onRetry={() => refetch()}
        emptyTitle="ロッカー契約が見つかりません"
      />
    );
  }

  const contract: LockerContractDetail = data.contract;

  const handleTabChange = (tab: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', tab);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  const isTerminated = isLockerContractTerminated(contract);
  const canTerminate = contract.status === LockerContractStatus.IN_USE && !isTerminated;
  const statusBadgeConfig = LOCKER_CONTRACT_STATUS_BADGE_MAP[contract.status];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        breadcrumb={<BackLink label="ロッカー管理に戻る" href={navigate('/lockers/contracts')} />}
        title={`ロッカー契約 ${contract.contract_id}`}
        subtitle={`${contract.member_name}（${contract.member_id}）— ロッカー ${contract.locker_number}`}
        badge={
          <Badge variant="outline" className={statusBadgeConfig.className}>
            <span className={`size-1.5 rounded-full ${statusBadgeConfig.dotClassName}`} />
            {statusBadgeConfig.label}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <RoleGatedButton
              requiredPermission={Permission.LockersContractsEdit}
              variant="outline"
              size="sm"
              className="gap-1"
              denyTooltip="編集権限がありません"
              onClick={() => router.push(navigate('/lockers/contracts/[id]/edit', contractId))}
            >
              <Pencil className="size-4" />
              編集
            </RoleGatedButton>

            {canTerminate && (
              <RoleGatedButton
                requiredPermission={Permission.LockersContractsEdit}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive gap-1"
                denyTooltip="解約操作の権限がありません"
                onClick={() => setTerminateOpen(true)}
              >
                <XCircle className="size-4" />
                解約する
              </RoleGatedButton>
            )}
          </div>
        }
      />

      <LockerContractTerminateDialog
        contractId={contractId}
        contract={contract}
        open={terminateOpen}
        onOpenChange={setTerminateOpen}
        onSuccess={() => setTerminateOpen(false)}
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="px-6 pt-4">
          <TabsList>
            <TabsTrigger value="contract">契約情報</TabsTrigger>
            <TabsTrigger value="history">変更履歴</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="contract" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <ContractInfoTab contract={contract} />
        </TabsContent>

        <TabsContent value="history" className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <HistoryTab contractId={contractId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
