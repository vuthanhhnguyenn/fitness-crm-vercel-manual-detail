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
  deleteCrmStoresByIdOptionsByOptionIdMutation,
  getCrmOptionsOptions,
  getCrmStoresByIdOptionsOptions,
  getCrmStoresByIdOptionsQueryKey,
  postCrmStoresByIdOptionsMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import type { StoreOption } from '../_schemas/contract-tab.schema';
import { BindItemsDrawer } from './bind-items-drawer';
import { RemoveActionButton } from './remove-action-button';
import { SectionHeader } from './section-header';

const PAGE_SIZE = 10;

export function OptionSection() {
  const params = useParams<{ id: string }>();
  const storeId = params?.id;
  const safeStoreId = storeId ?? '';
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);

  const { data: linkedOptionsRes, isLoading } = useQuery({
    ...getCrmStoresByIdOptionsOptions({ path: { id: safeStoreId } }),
    enabled: Boolean(storeId),
  });

  const { data: optionCatalogRes } = useQuery({
    ...getCrmOptionsOptions({ query: { page: 1, limit: 200, status: 'active' } }),
  });

  const items = useMemo<StoreOption[]>(
    () => linkedOptionsRes?.options ?? [],
    [linkedOptionsRes?.options],
  );

  const availableOptions = useMemo(() => {
    const catalog = optionCatalogRes?.options ?? [];
    const linkedIds = new Set(items.map((item) => item.id));
    return catalog
      .filter((item) => !linkedIds.has(item.id))
      .map((item) => ({
        ...item,
        source: item.option_type === 'metered' ? ('store' as const) : ('hq' as const),
        related_option_name:
          item.option_type === 'metered'
            ? 'パーソナル'
            : item.option_type === 'auto_attached'
              ? '自動付与'
              : null,
      }));
  }, [items, optionCatalogRes?.options]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  const linkOptionsMutation = useMutation({
    ...postCrmStoresByIdOptionsMutation(),
    onSuccess: async () => {
      if (!storeId) return;
      await queryClient.invalidateQueries({
        queryKey: getCrmStoresByIdOptionsQueryKey({ path: { id: safeStoreId } }),
      });
      toast.success('オプションを紐づけました');
    },
    onError: () => toast.error('オプションの紐づけに失敗しました'),
  });

  const unlinkOptionMutation = useMutation({
    ...deleteCrmStoresByIdOptionsByOptionIdMutation(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getCrmStoresByIdOptionsQueryKey({ path: { id: safeStoreId } }),
      });
      toast.success('オプションの紐づけを解除しました');
    },
    onError: () => toast.error('オプションの紐づけ解除に失敗しました'),
  });

  const columns = useMemo<ColumnDef<StoreOption>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'オプションID',
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
      },
      {
        accessorKey: 'name',
        header: 'オプション名',
        cell: ({ row }) => <span className="text-xs">{row.original.name}</span>,
        meta: { className: 'w-full min-w-40' },
      },
      {
        accessorKey: 'related_option_name',
        header: '関連オプション',
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">
            {row.original.related_option_name ?? '—'}
          </span>
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
        id: 'actions',
        header: () => <div className="text-center text-xs font-semibold">操作</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <RemoveActionButton
              dialogTitle="オプションの紐づけを解除しますか？"
              dialogDescription={`「${row.original.name}」の紐づけを解除します。新規契約はできなくなります。`}
              isPending={unlinkOptionMutation.isPending}
              onConfirm={() =>
                unlinkOptionMutation.mutate({
                  path: { id: safeStoreId, optionId: row.original.id },
                })
              }
            />
          </div>
        ),
      },
    ],
    [safeStoreId, unlinkOptionMutation],
  );

  const handleBindOptions = (selectedOptionIds: string[]) => {
    if (!storeId || selectedOptionIds.length === 0) return;
    linkOptionsMutation.mutate({
      path: { id: safeStoreId },
      body: { option_ids: selectedOptionIds },
    });
  };

  return (
    <Card className="border-border bg-card rounded-lg py-0 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <SectionHeader
          title="オプション"
          count={items.length}
          action={
            <BindItemsDrawer
              title="オプションを紐づける"
              description="「商材・施策 > オプション管理」で作成されたオプションから、この店舗で扱うオプションを選んで紐づけてください。"
              searchPlaceholder="オプション名・IDで検索"
              listLabel="主契約のオプション"
              emptyLabel="紐づけ可能なオプションがありません。"
              items={availableOptions}
              getSubText={(item) =>
                `${item.related_option_name ?? '一般'}・${formatYen(item.price_including_tax)}・${item.id}`
              }
              onBind={handleBindOptions}
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
