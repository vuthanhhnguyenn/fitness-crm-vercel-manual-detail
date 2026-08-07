'use client';

import { useCallback, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { StudioSearch } from '@/app/(private)/studios/_components/studio-search';
import type { StudioListItem } from '@/app/api/_schemas/studio.schema';
import { useQuery } from '@tanstack/react-query';
import type { SortingState } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Plus, SlidersHorizontal } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';
import { useStudioList } from '@/hooks/useStudioList';

import { BrandBadge } from '@/components/common/brand-badge';
import { DataStateBoundary } from '@/components/common/data-state-boundary';
import { DataTable } from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { TablePagination } from '@/components/common/table-pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { getCrmStudiosOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Brand } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

const TYPE_OPTIONS = [
  { value: '', label: '全区分' },
  { value: 'studio-lesson', label: 'スタジオレッスン用' },
  { value: 'pt', label: 'PT用' },
  { value: 'body-care', label: 'ボディケア用' },
];

const BRAND_OPTIONS = [
  { value: '', label: '全ブランド' },
  { value: 'joyfit', label: 'JOYFIT' },
  { value: 'fit365', label: 'FIT365' },
  { value: 'joyfit24', label: 'JOYFIT24' },
  { value: 'joyfit_yoga', label: 'JOYFIT YOGA' },
  { value: 'joyfit_plus', label: 'JOYFIT+' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全ステータス' },
  { value: 'active', label: '有効' },
  { value: 'inactive', label: '無効' },
];

const PAGE_SIZE = 50;
// --- Helper ---
function TypeBadge({ type }: { type: 'studio-lesson' | 'pt' | 'body-care' }) {
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
  const [filterExpanded, setFilterExpanded] = useState(false);

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

  const { data, isLoading, isError, refetch } = useQuery(
    getCrmStudiosOptions({ query: queryParams }),
  );

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const activeFilterCount = [store_id, studio_type, brand, status].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || search !== '';

  const [sorting, setSorting] = useState<SortingState>([
    { id: sort_by, desc: sort_order === 'desc' },
  ]);
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

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }: { column: any }) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }: { row: { original: StudioListItem } }) => (
          <span className="text-muted-foreground text-xs">{row.original.id}</span>
        ),
        meta: { className: 'w-[60px]' },
      },
      {
        accessorKey: 'name',
        header: ({ column }: { column: any }) => (
          <DataTableColumnHeader column={column} title="スタジオ名" />
        ),
        cell: ({ row }: { row: { original: StudioListItem } }) => (
          <span className="text-sm font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'store_name',
        header: '店舗名',
        cell: ({ row }: { row: { original: StudioListItem } }) => (
          <span className="text-muted-foreground text-xs">{row.original.store_name}</span>
        ),
      },
      {
        accessorKey: 'studio_type',
        header: '区分',
        cell: ({ row }: { row: { original: StudioListItem } }) => {
          const studioType = row.original.studio_type;
          return <TypeBadge type={studioType} />;
        },
      },
      {
        accessorKey: 'capacity',
        header: '定員',
        cell: ({ row }: { row: { original: StudioListItem } }) => (
          <span className="text-xs">{row.original.capacity}名</span>
        ),
        meta: { className: 'w-[80px]' },
      },
      // {
      //   accessorKey: 'available_hours',
      //   header: '利用時間',
      //   enableSorting: false,
      //   cell: ({ row }: { row: { original: StudioListItem } }) => (
      //     <span className="text-muted-foreground text-xs">{row.original.available_hours}</span>
      //   ),
      //   meta: { className: 'w-[140px]' },
      // },
      {
        accessorKey: 'brand',
        header: 'ブランド',
        enableSorting: false,
        cell: ({ row }: { row: { original: StudioListItem } }) => (
          <BrandBadge brand={row.original.brand as Brand} />
        ),
        meta: { className: 'w-[100px]' },
      },
      {
        accessorKey: 'status',
        header: 'ステータス',
        enableSorting: false,
        cell: ({ row }: { row: { original: StudioListItem } }) =>
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
          <div className="space-y-3 px-4 py-3">
            <div className="flex items-center gap-2">
              <StudioSearch value={search} onChange={(v) => setParams({ search: v, page: 1 })} />
              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant={activeFilterCount > 0 ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setFilterExpanded(!filterExpanded)}
                >
                  <SlidersHorizontal className="size-4" />
                  詳細フィルター
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-5 px-1 text-[10px]">
                      {activeFilterCount}
                    </Badge>
                  )}
                  {filterExpanded ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </Button>
              </div>
            </div>

            {filterExpanded && (
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={studio_type || '全区分'}
                  onValueChange={(v) => {
                    setParams({
                      studio_type: v === '全区分' ? '' : v,
                      page: 1,
                    });
                  }}
                >
                  <SelectTrigger
                    className={`h-8 w-40 text-xs ${studio_type ? 'border-primary bg-primary/10 text-foreground' : ''}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || '全区分'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={brand || '全ブランド'}
                  onValueChange={(v) => {
                    setParams({
                      brand: v === '全ブランド' ? '' : v,
                      page: 1,
                    });
                  }}
                >
                  <SelectTrigger
                    className={`h-8 w-32 text-xs ${brand ? 'border-primary bg-primary/10 text-foreground' : ''}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAND_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || '全ブランド'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={status || '全ステータス'}
                  onValueChange={(v) => {
                    setParams({
                      status: v === '全ステータス' ? '' : v,
                      page: 1,
                    });
                  }}
                >
                  <SelectTrigger
                    className={`h-8 w-32 text-xs ${status ? 'border-primary bg-primary/10 text-foreground' : ''}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value || '全ステータス'}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground ml-auto h-8 text-xs"
                    onClick={handleClearFilters}
                  >
                    すべてクリア
                  </Button>
                )}
              </div>
            )}
          </div>

          <DataStateBoundary
            isLoading={isLoading}
            isError={isError}
            isEmpty={!isLoading && items.length === 0}
            onRetry={() => refetch()}
            emptyTitle="スタジオが見つかりません"
            emptyDescription={
              hasActiveFilters
                ? '検索条件を変更してお試しください'
                : '登録されたスタジオがありません'
            }
            skeleton={
              <DataTable
                columns={columns}
                data={[]}
                isLoading
                variant="simple"
                className="rounded-none border-x-0 border-b-0"
              />
            }
          >
            <DataTable
              columns={columns}
              data={items}
              variant="simple"
              onRowClick={(row) =>
                router.push(navigate('/studios/[id]', (row as StudioListItem).id))
              }
              className="rounded-none border-x-0 border-b-0"
              tableOptions={{
                manualSorting: true,
                onSortingChange: handleSortingChange,
                state: { sorting },
                getRowId: (originalRow) => (originalRow as StudioListItem).id,
              }}
            />
          </DataStateBoundary>

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
