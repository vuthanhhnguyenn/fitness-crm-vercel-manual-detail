'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { ColumnDef, type SortingState, getSortedRowModel } from '@tanstack/react-table';
import { Plus } from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce.hook';
import { useInstructorList } from '@/hooks/useInstructorList';

import { BrandBadge } from '@/components/common/brand-badge';
import { Empty } from '@/components/common/data-state-boundary/empty';
import { DataTable } from '@/components/common/data-table';
import { DataTableColumnHeader } from '@/components/common/data-table/data-table-column-header';
import { PageHeader } from '@/components/common/page-header';
import { RoleGatedButton } from '@/components/common/role-gated-button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';

import { getCrmInstructorsOptions } from '@/lib/api/@tanstack/react-query.gen';
import type { Brand, GetCrmInstructorsResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { Permission } from '@/types/permission.type';

import { InstructorAvatar } from './instructor-avatar';
import { InstructorFilters } from './instructor-filters';
import { InstructorTabs } from './instructor-tabs';

const ROLE_LABELS: Record<string, string> = {
  trainer: 'トレーナー',
  instructor: 'インストラクター',
  body_care_therapist: 'ボディケアセラピスト',
};

function StatusBadge({ status }: { status?: 'active' | 'inactive' }) {
  if (status === 'inactive') {
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[11px]">
        無効
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[11px]">
      有効
    </Badge>
  );
}

export function InstructorListSection() {
  const router = useRouter();
  const { params, setParams, resetFilters } = useInstructorList();
  const {
    tab: activeTab,
    search,
    role: filterRole,
    brand: filterBrand,
    status: filterStatus,
  } = params;

  const debouncedSearch = useDebounce(search, 300);

  const queryParams = useMemo(() => {
    const p: Record<string, string> = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (filterRole) p.role = filterRole;
    if (filterBrand) p.brand = filterBrand;
    if (filterStatus) p.status = filterStatus;
    return p;
  }, [debouncedSearch, filterRole, filterBrand, filterStatus]);

  const { data, isLoading, isError } = useQuery(getCrmInstructorsOptions({ query: queryParams }));

  // Unfiltered totals — tab badges and the header count reflect the full
  // per-tab totals in scope, independent of the active search/filter (which
  // only narrows the currently displayed table). Keeps one tab's search from
  // dragging the other tab's badge (or the header total) down to 0.
  const { data: totalsData } = useQuery(getCrmInstructorsOptions({ query: {} }));
  const allInstructors = useMemo(() => totalsData?.instructors ?? [], [totalsData]);
  const studioTotal = useMemo(
    () => allInstructors.filter((i) => i.tab !== 'pt').length,
    [allInstructors],
  );
  const ptTotal = useMemo(
    () => allInstructors.filter((i) => i.tab === 'pt').length,
    [allInstructors],
  );

  const instructors = useMemo(() => data?.instructors ?? [], [data]);
  const studioInstructors = useMemo(() => instructors.filter((i) => i.tab !== 'pt'), [instructors]);
  const ptInstructors = useMemo(() => instructors.filter((i) => i.tab === 'pt'), [instructors]);

  const activeFilterCount = [filterRole, filterBrand, filterStatus].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0 || search !== '';

  const columns: ColumnDef<GetCrmInstructorsResponse['instructors'][number]>[] = useMemo(
    () => [
      {
        accessorKey: 'instructor_id',
        header: ({ column }: { column: any }) => (
          <DataTableColumnHeader column={column} title="ID" />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs">{row.original.instructor_id}</span>
        ),
        meta: { className: 'w-[80px]' },
      },
      {
        accessorKey: 'instructor_name',
        header: ({ column }: { column: any }) => (
          <DataTableColumnHeader column={column} title="氏名" />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <InstructorAvatar
              id={row.original.instructor_id}
              name={row.original.instructor_name}
              photoUrl={row.original.photo_url}
            />
            <div>
              <p className="text-sm font-medium">{row.original.instructor_name}</p>
              {row.original.nickname && (
                <p className="text-muted-foreground text-[11px]">{row.original.nickname}</p>
              )}
            </div>
          </div>
        ),
        meta: { className: 'w-[240px]' },
      },
      {
        accessorKey: 'role_classifications',
        header: '役割区分',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.role_classifications ?? []).map((role) => (
              <Badge key={role} variant="outline" className="text-[10px] font-normal">
                {ROLE_LABELS[role] ?? role}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: 'brands',
        header: 'ブランド',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {(row.original.brands ?? []).map((brand) => (
              <BrandBadge key={brand} brand={brand as Brand} />
            ))}
          </div>
        ),
        meta: { className: 'w-[160px]' },
      },
      {
        accessorKey: 'status',
        header: 'ステータス',
        enableSorting: false,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { className: 'w-[100px]' },
      },
    ],
    [],
  );

  const [sorting, setSorting] = useState<SortingState>([]);

  const renderTable = (rows: GetCrmInstructorsResponse['instructors']) => (
    <>
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        variant="simple"
        onRowClick={(row) =>
          router.push(
            navigate(
              '/instructors/[id]',
              (row as GetCrmInstructorsResponse['instructors'][number]).instructor_id,
            ),
          )
        }
        className="rounded-none border-x-0 border-b-0"
        tableOptions={{
          getRowId: (originalRow) =>
            (originalRow as GetCrmInstructorsResponse['instructors'][number]).instructor_id,
          getSortedRowModel: getSortedRowModel(),
          onSortingChange: setSorting,
          state: { sorting },
        }}
        emptyContent={
          <Empty
            onAction={resetFilters}
            title="指導者が見つかりません"
            description={
              hasActiveFilters ? '検索条件を変更してお試しください' : '登録された指導者がいません'
            }
          />
        }
      />
      {!isLoading && !isError && rows.length > 0 && (
        <div className="text-muted-foreground border-t px-4 py-3 text-xs">
          {rows.length}件中 1-{rows.length}件を表示
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col">
      <PageHeader
        title="指導者管理"
        badge={
          <Badge variant="secondary" className="text-xs">
            {allInstructors.length.toLocaleString()}件
          </Badge>
        }
        actions={
          <RoleGatedButton
            requiredPermission={Permission.InstructorsCreate}
            denyTooltip="新規登録は本部・マネージャー・スタッフのみ可能です"
            type="button"
            className="h-8 gap-1 rounded-[10px] px-3 text-sm font-semibold"
            onClick={() => router.push(navigate('/instructors/create'))}
          >
            <Plus className="size-3.5" />
            新規指導者登録
          </RoleGatedButton>
        }
      />

      <div className="px-6 py-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) =>
            setParams({
              tab: v as 'studio' | 'pt',
              search: '',
              role: '',
              brand: '',
              status: '',
            })
          }
          className="gap-4"
        >
          <InstructorTabs studioCount={studioTotal} ptCount={ptTotal} />

          <Card className="gap-0 overflow-hidden py-0">
            <div className="space-y-3 px-4 py-3">
              <InstructorFilters
                search={search}
                onSearchChange={(v) => setParams({ search: v })}
                filterRole={filterRole}
                filterBrand={filterBrand}
                filterStatus={filterStatus}
                onRoleChange={(v) => setParams({ role: v })}
                onBrandChange={(v) => setParams({ brand: v })}
                onStatusChange={(v) => setParams({ status: v })}
                onClearFilters={resetFilters}
                activeFilterCount={activeFilterCount}
              />
            </div>

            <TabsContent value="studio" className="mt-0">
              {renderTable(studioInstructors)}
            </TabsContent>
            <TabsContent value="pt" className="mt-0">
              {renderTable(ptInstructors)}
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
