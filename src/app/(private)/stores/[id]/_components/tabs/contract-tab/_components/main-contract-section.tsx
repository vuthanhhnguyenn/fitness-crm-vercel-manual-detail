'use client';

import { useMemo, useState } from 'react';

import { useParams } from 'next/navigation';

import { formatYen } from '@/utils/format.util';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';

import { DataTable } from '@/components/common/data-table';
import { TablePagination } from '@/components/common/table-pagination';
import { Card, CardContent } from '@/components/ui/card';

import {
  deleteCrmStoresByIdMainContractsByContractIdMutation,
  getCrmMainContractsOptions,
  getCrmStoresByIdMainContractsOptions,
  getCrmStoresByIdMainContractsQueryKey,
  postCrmStoresByIdMainContractsMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import type { StoreMainContract } from '../_schemas/contract-tab.schema';
import { CONTRACT_TYPE_LABELS } from '../contract-tab.data';
import { BindItemsDrawer } from './bind-items-drawer';
import { RemoveActionButton } from './remove-action-button';
import { SectionHeader } from './section-header';

const PAGE_SIZE = 10;

export function MainContractSection() {
  const params = useParams<{ id: string }>();
  const storeId = params?.id;
  const safeStoreId = storeId ?? '';
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);

  const { data: linkedContractsRes, isLoading } = useQuery({
    ...getCrmStoresByIdMainContractsOptions({ path: { id: safeStoreId } }),
    enabled: Boolean(storeId),
  });

  const { data: contractCatalogRes } = useQuery({
    ...getCrmMainContractsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
  });

  const items = useMemo<StoreMainContract[]>(
    () => linkedContractsRes?.main_contracts ?? [],
    [linkedContractsRes?.main_contracts],
  );

  const availableMainContracts = useMemo(() => {
    const catalog = contractCatalogRes?.main_contracts ?? [];
    const linkedIds = new Set(items.map((item) => item.id));
    return catalog
      .filter((item) => !linkedIds.has(item.id))
      .map((item) => ({
        ...item,
        source: item.target_store_name ? ('store' as const) : ('hq' as const),
      }));
  }, [contractCatalogRes?.main_contracts, items]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const linkMainContractsMutation = useMutation({
    ...postCrmStoresByIdMainContractsMutation(),
    onSuccess: async () => {
      if (!storeId) return;
      await queryClient.invalidateQueries({
        queryKey: getCrmStoresByIdMainContractsQueryKey({ path: { id: safeStoreId } }),
      });
      toast.success('主契約を紐づけました');
    },
    onError: () => toast.error('主契約の紐づけに失敗しました'),
  });

  const unlinkMainContractMutation = useMutation({
    ...deleteCrmStoresByIdMainContractsByContractIdMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getCrmStoresByIdMainContractsQueryKey({ path: { id: safeStoreId } }),
      });
      toast.success('主契約の紐づけを解除しました');
    },
    onError: () => toast.error('主契約の紐づけ解除に失敗しました'),
  });

  const columns = useMemo<ColumnDef<StoreMainContract>[]>(
    () => [
      {
        accessorKey: 'id',
        header: '主契約ID',
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      },
      {
        accessorKey: 'name',
        header: '主契約名',
        cell: ({ row }) => <span className="text-xs">{row.original.name}</span>,
        meta: { className: 'w-full min-w-40' },
      },
      {
        accessorKey: 'contract_type',
        header: '契約タイプ',
        cell: ({ row }) => (
          <span className="text-xs">{CONTRACT_TYPE_LABELS[row.original.contract_type]}</span>
        ),
      },
      {
        accessorKey: 'price_including_tax',
        header: () => <div className="text-right text-xs font-semibold">料金（税込）</div>,
        cell: ({ row }) => (
          <div className="text-right text-xs">{formatYen(row.original.price_including_tax)}</div>
        ),
      },
      {
        accessorKey: 'linked_at',
        header: '紐づけ日',
        cell: ({ row }) => <span className="text-xs">{row.original.linked_at}</span>,
      },
      {
        id: 'actions',
        header: () => <div className="text-center text-xs font-semibold">操作</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <RemoveActionButton
              dialogTitle="プランの紐づけを解除しますか？"
              dialogDescription={`「${row.original.name}」の紐づけを解除します。新規契約はできなくなります。`}
              isPending={unlinkMainContractMutation.isPending}
              onConfirm={() =>
                unlinkMainContractMutation.mutate({
                  path: { id: safeStoreId, contractId: row.original.id },
                })
              }
            />
          </div>
        ),
      },
    ],
    [safeStoreId, unlinkMainContractMutation],
  );

  const handleBindMainContracts = (selectedMainIds: string[]) => {
    if (!storeId || selectedMainIds.length === 0) return;
    linkMainContractsMutation.mutate({
      path: { id: safeStoreId },
      body: { main_contract_ids: selectedMainIds },
    });
  };

  return (
    <Card className="border-border bg-card rounded-lg py-0 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <SectionHeader
          title="主契約プラン"
          count={items.length}
          action={
            <BindItemsDrawer
              title="主契約プランを紐づける"
              description="「商材・施策 > 主契約管理」で作成されたプランから、この店舗で扱うプランを選んで紐づけてください。"
              searchPlaceholder="プラン名・IDで検索"
              listLabel="主契約のプラン"
              emptyLabel="紐づけ可能な主契約プランがありません。"
              items={availableMainContracts}
              getSubText={(item) =>
                `${CONTRACT_TYPE_LABELS[item.contract_type]}・${formatYen(item.price_including_tax)}・${item.id}`
              }
              onBind={handleBindMainContracts}
            />
          }
        />

        <DataTable
          variant="simple"
          columns={columns}
          data={paginatedItems}
          isLoading={isLoading}
          className="rounded-md"
          containerClassName="max-h-[420px]"
        />

        {total > PAGE_SIZE ? (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            total={total}
            limit={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
