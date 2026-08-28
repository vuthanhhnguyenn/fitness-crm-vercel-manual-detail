'use client';

import { useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { StudioFilters } from '@/app/(private)/studios/_components/studio-filters';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';
import { useStudioList } from '@/hooks/useStudioList';

import { BrandBadge } from '@/components/common/brand-badge';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

import { getCrmStudiosOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Brand, GetCrmStudiosResponses } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

const PAGE_SIZE = 50;
// --- Helper ---
export function TypeBadge({
  type,
}: Readonly<{
  type: 'studio-lesson' | 'pt' | 'body-care';
}>) {
  switch (type) {
    case 'studio-lesson':
      return (
        <Badge
          variant="outline"
          className="bg-muted text-muted-foreground border-border text-[11px]"
        >
          スタジオレッスン用
        </Badge>
      );
    case 'pt':
      return (
        <Badge
          variant="outline"
          className="bg-warning/10 text-warning border-warning/20 text-[11px]"
        >
          PT用
        </Badge>
      );
    case 'body-care':
      return (
        <Badge variant="outline" className="bg-info/10 text-info border-info/20 text-[11px]">
          ボディケア用
        </Badge>
      );
  }
}
export function StudioListSection() {
  const router = useRouter();
  const { params, setParams, resetFilters } = useStudioList();
  const { search, store_id, studio_type, brand, status, sort_by, sort_order, page } = params;

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = {
      page,
      limit: PAGE_SIZE,
      sort_by,
      sort_order,
    };
    if (debouncedSearch) p.search = debouncedSearch;
    if (store_id) p.store_id = store_id;
    if (studio_type) p.studio_type = studio_type;
    if (brand) p.brand = brand;
    if (status) p.status = status;
    return p;
  }, [debouncedSearch, store_id, studio_type, brand, status, sort_by, sort_order, page]);

  const { data, isLoading } = useQuery(getCrmStudiosOptions({ query: queryParams }));

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const activeFilterCount = [store_id, studio_type, brand, status].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || search !== '';

  const [sorting, setSorting] = useState<SortingState>(() =>
    sort_by === 'id' && sort_order === 'asc' ? [] : [{ id: sort_by, desc: sort_order === 'desc' }],
  );
  const handleSortingChange = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      if (next.length === 0) return;
      setParams({
        sort_by: next[0].id,
        sort_order: next[0].desc ? 'desc' : 'asc',
        page: 1,
      });
    },
    [sorting, setParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setParams({ page: newPage });
    },
    [setParams],
  );

  const handleClearFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  const columns: ColumnDef<GetCrmStudiosResponses['200']['items'][number]>[] = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
        cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.id}</span>,
        meta: { className: 'w-[60px]' },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="スタジオ名" />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'store_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="店舗名" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{row.original.store_name}</span>
        ),
      },
      {
        accessorKey: 'studio_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="区分" />,
        cell: ({ row }) => {
          const studioType = row.original.studio_type;
          return <TypeBadge type={studioType} />;
        },
      },
      {
        accessorKey: 'capacity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="定員" />,
        cell: ({ row }) => <span className="text-xs">{row.original.capacity}名</span>,
        meta: { className: 'w-[80px]' },
      },
      {
        accessorKey: 'available_hours',
        header: '利用時間',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{row.original.available_hours}</span>
        ),
        meta: { className: 'w-[140px]' },
      },
      {
        accessorKey: 'brand',
        header: 'ブランド',
        enableSorting: false,
        cell: ({ row }) => <BrandBadge brand={row.original.brand as Brand} />,
        meta: { className: 'w-[100px]' },
      },
      {
        accessorKey: 'status',
        header: 'ステータス',
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === 'active' ? (
            <Badge
              variant="outline"
              className="bg-success/10 text-success border-success/20 text-[11px]"
            >
              有効
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-muted text-muted-foreground border-muted-foreground/20 text-[11px]"
            >
              無効
            </Badge>
          ),
        meta: { className: 'w-[100px]' },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="スタジオ管理"
        badge={
          <Badge variant="secondary" className="text-xs">
            {total.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.StudiosCreate}
            type="button"
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={() => router.push(navigate('/studios/create'))}
          >
            <Plus className="size-3.5" />
            新規スタジオ登録
          </RoleGatedButton>
        }
      />

      <div className="px-6 py-4">
        <Card className="gap-0 overflow-hidden py-0">
          <StudioFilters
            search={search}
            onSearchChange={(v) => setParams({ search: v, page: 1 })}
            storeId={store_id}
            onStoreIdChange={(v) => setParams({ store_id: v, page: 1 })}
            studioType={studio_type}
            onStudioTypeChange={(v) => setParams({ studio_type: v, page: 1 })}
            brand={brand}
            onBrandChange={(v) => setParams({ brand: v, page: 1 })}
            status={status}
            onStatusChange={(v) => setParams({ status: v, page: 1 })}
            activeFilterCount={activeFilterCount}
            onClearFilters={handleClearFilters}
          />
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            variant="simple"
            onRowClick={(row) => router.push(navigate('/studios/[id]', row.id))}
            className="rounded-none border-x-0 border-b-0"
            tableOptions={{
              manualSorting: true,
              onSortingChange: handleSortingChange,
              state: { sorting },
              getRowId: (originalRow) => originalRow.id,
            }}
            emptyContent={
              <Empty
                onAction={handleClearFilters}
                title="スタジオが見つかりません"
                description={
                  hasActiveFilters
                    ? '検索条件を変更してお試しください'
                    : '登録されたスタジオがありません'
                }
              />
            }
          />

          {total > 0 && (
            <TablePagination
              currentPage={page}
              totalPages={Math.ceil(total / PAGE_SIZE)}
              total={total}
              limit={PAGE_SIZE}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
